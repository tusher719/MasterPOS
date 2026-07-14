<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\PartnerProfitEligibility;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PartnerEligibilityService
{
    // -----------------------------------------------------------------------
    // Eligibility Check — used by Phase 4F Calculation Engine
    // -----------------------------------------------------------------------

    /**
     * Check whether a partner is eligible for a given distribution period.
     * An active eligibility record must fully cover period_start → period_end.
     */
    public function isEligible(Partner $partner, string $periodStart, string $periodEnd): bool
    {
        return $partner->eligibilities()
            ->coveringPeriod($periodStart, $periodEnd)
            ->exists();
    }

    /**
     * Batch check — returns array keyed by partner_id => bool.
     * Used by the calculation engine to avoid N+1 on multi-partner distributions.
     */
    public function isEligibleBatch(array $partnerIds, string $periodStart, string $periodEnd): array
    {
        $eligibleIds = PartnerProfitEligibility::query()
            ->whereIn('partner_id', $partnerIds)
            ->coveringPeriod($periodStart, $periodEnd)
            ->pluck('partner_id')
            ->toArray();

        $result = [];
        foreach ($partnerIds as $id) {
            $result[$id] = in_array($id, $eligibleIds);
        }

        return $result;
    }

    /**
     * Return the active eligibility record for a partner, or null.
     */
    public function getActiveRecord(Partner $partner): ?PartnerProfitEligibility
    {
        return $partner->eligibilities()->active()->latest('profit_start_date')->first();
    }

    /**
     * Check whether a partner has any active eligibility record (regardless of period).
     */
    public function hasActiveEligibility(Partner $partner): bool
    {
        return $partner->eligibilities()->active()->exists();
    }

    // -----------------------------------------------------------------------
    // Create
    // -----------------------------------------------------------------------

    /**
     * Create a new eligibility record for a partner.
     * Enforces: only one active record allowed at a time.
     *
     * @throws \RuntimeException
     */
    public function create(Partner $partner, array $data): PartnerProfitEligibility
    {
        if ($this->hasActiveEligibility($partner)) {
            throw new \RuntimeException(
                'Partner already has an active eligibility record. Pause or end the existing record before creating a new one.'
            );
        }

        return DB::transaction(function () use ($partner, $data) {
            $eligibility = PartnerProfitEligibility::create([
                'partner_id'        => $partner->id,
                'profit_start_date' => $data['profit_start_date'],
                'profit_end_date'   => $data['profit_end_date'] ?? null,
                'status'            => 'active',
                'created_by'        => Auth::id(),
            ]);

            ActivityLogService::log(
                'partners',
                'eligibility_created',
                "Profit eligibility created for partner [{$partner->name}] from [{$eligibility->profit_start_date->toDateString()}]",
                $eligibility,
                [
                    'partner_id'        => $partner->id,
                    'profit_start_date' => $eligibility->profit_start_date->toDateString(),
                    'profit_end_date'   => $eligibility->profit_end_date?->toDateString(),
                ]
            );

            return $eligibility;
        });
    }

    // -----------------------------------------------------------------------
    // Pause
    // -----------------------------------------------------------------------

    /**
     * Pause an active eligibility record.
     * pause_reason is mandatory.
     *
     * @throws \RuntimeException
     */
    public function pause(PartnerProfitEligibility $eligibility, string $pauseReason): PartnerProfitEligibility
    {
        if (! $eligibility->is_active) {
            throw new \RuntimeException('Only active eligibility records can be paused.');
        }

        return DB::transaction(function () use ($eligibility, $pauseReason) {
            $eligibility->update([
                'status'       => 'paused',
                'pause_reason' => $pauseReason,
                'paused_by'    => Auth::id(),
                'paused_at'    => now(),
            ]);

            ActivityLogService::log(
                'partners',
                'eligibility_paused',
                "Profit eligibility paused for partner [{$eligibility->partner->name}]. Reason: {$pauseReason}",
                $eligibility,
                [
                    'partner_id'   => $eligibility->partner_id,
                    'paused_by'    => Auth::id(),
                    'pause_reason' => $pauseReason,
                ]
            );

            return $eligibility->fresh();
        });
    }

    // -----------------------------------------------------------------------
    // Resume
    // -----------------------------------------------------------------------

    /**
     * Resume a paused eligibility by creating a new active record.
     * The old (paused) record is updated with resumed_by/resumed_at — it stays paused.
     * A brand new active record is created from resume_date onward.
     *
     * @throws \RuntimeException
     */
    public function resume(PartnerProfitEligibility $eligibility, string $resumeDate, ?string $endDate = null): PartnerProfitEligibility
    {
        if (! $eligibility->is_paused) {
            throw new \RuntimeException('Only paused eligibility records can be resumed.');
        }

        return DB::transaction(function () use ($eligibility, $resumeDate, $endDate) {
            // Mark the paused record as having been resumed (audit only — status stays 'paused')
            $eligibility->update([
                'resumed_by' => Auth::id(),
                'resumed_at' => now(),
            ]);

            // Create a new active record from the resume date
            $newEligibility = PartnerProfitEligibility::create([
                'partner_id'        => $eligibility->partner_id,
                'profit_start_date' => $resumeDate,
                'profit_end_date'   => $endDate ?? null,
                'status'            => 'active',
                'created_by'        => Auth::id(),
            ]);

            ActivityLogService::log(
                'partners',
                'eligibility_resumed',
                "Profit eligibility resumed for partner [{$eligibility->partner->name}] from [{$resumeDate}]",
                $newEligibility,
                [
                    'partner_id'         => $eligibility->partner_id,
                    'previous_record_id' => $eligibility->id,
                    'new_record_id'      => $newEligibility->id,
                    'resume_date'        => $resumeDate,
                ]
            );

            return $newEligibility;
        });
    }

    // -----------------------------------------------------------------------
    // End
    // -----------------------------------------------------------------------

    /**
     * End an active eligibility record.
     * Sets profit_end_date = today and status = 'ended'.
     *
     * @throws \RuntimeException
     */
    public function end(PartnerProfitEligibility $eligibility): PartnerProfitEligibility
    {
        if (! $eligibility->is_active) {
            throw new \RuntimeException('Only active eligibility records can be ended.');
        }

        return DB::transaction(function () use ($eligibility) {
            $eligibility->update([
                'status'          => 'ended',
                'profit_end_date' => now()->toDateString(),
            ]);

            ActivityLogService::log(
                'partners',
                'eligibility_ended',
                "Profit eligibility ended for partner [{$eligibility->partner->name}] on [" . now()->toDateString() . "]",
                $eligibility,
                [
                    'partner_id'      => $eligibility->partner_id,
                    'profit_end_date' => now()->toDateString(),
                ]
            );

            return $eligibility->fresh();
        });
    }
}
