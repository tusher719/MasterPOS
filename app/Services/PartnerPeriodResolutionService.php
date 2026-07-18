<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\ProfitDistribution;
use App\Models\ProfitDistributionItem;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Resolves the Effective Period for each partner in a distribution.
 *
 * Effective Start = MAX(selected_start, eligibility_start, last_paid_up_to + 1 day)
 * Effective End   = MIN(selected_end, eligibility_end)
 *
 * If Effective Start > Effective End → partner is fully ineligible.
 */
class PartnerPeriodResolutionService
{
    /**
     * Resolve effective periods for a list of partner IDs.
     *
     * @param  array       $partnerIds      List of partner IDs to resolve
     * @param  string      $selectedStart   Distribution period_start (Y-m-d)
     * @param  string      $selectedEnd     Distribution period_end   (Y-m-d)
     * @param  int|null    $excludeDistributionId  Current distribution to exclude from overlap check
     * @return Collection  Keyed by partner_id → array with resolved period info
     */
    public function resolveAll(
        array $partnerIds,
        string $selectedStart,
        string $selectedEnd,
        ?int $excludeDistributionId = null
    ): Collection {
        if (empty($partnerIds)) {
            return collect();
        }

        // --- 1. Eligibility windows per partner ---
        $eligibilityMap = $this->getEligibilityWindows($partnerIds, $selectedStart, $selectedEnd);

        // --- 2. Last-paid-up-to dates per partner (overlap check) ---
        $lastPaidMap = $this->getLastPaidUpTo($partnerIds, $selectedStart, $selectedEnd, $excludeDistributionId);

        // --- 3. Compute effective period per partner ---
        $results = collect();

        foreach ($partnerIds as $partnerId) {
            $eligibility     = $eligibilityMap->get($partnerId);
            $lastPaidInfo    = $lastPaidMap->get($partnerId);

            // If no active eligibility record covering any part of the selected period → ineligible
            if (! $eligibility) {
                $results->put($partnerId, $this->ineligibleResult($partnerId, 'No active eligibility record covering this period'));
                continue;
            }

            $eligibilityStart = $eligibility['profit_start_date'];
            $eligibilityEnd   = $eligibility['profit_end_date']; // null = ongoing

            // Effective Start = MAX(selected_start, eligibility_start, last_paid_up_to + 1 day)
            $effectiveStart = max(
                $selectedStart,
                $eligibilityStart,
                $lastPaidInfo ? $lastPaidInfo['paid_up_to_next_day'] : $selectedStart
            );

            // Effective End = MIN(selected_end, eligibility_end)
            $effectiveEnd = $eligibilityEnd
                ? min($selectedEnd, $eligibilityEnd)
                : $selectedEnd;

            // If effective window is empty → partner fully ineligible for this distribution
            if ($effectiveStart > $effectiveEnd) {
                $results->put($partnerId, $this->ineligibleResult(
                    $partnerId,
                    'Effective period is empty after applying eligibility and prior payment constraints',
                    $effectiveStart,
                    $effectiveEnd,
                    $lastPaidInfo
                ));
                continue;
            }

            $results->put($partnerId, [
                'partner_id'          => $partnerId,
                'is_eligible'         => true,
                'effective_start'     => $effectiveStart,
                'effective_end'       => $effectiveEnd,
                'selected_start'      => $selectedStart,
                'selected_end'        => $selectedEnd,
                'eligibility_start'   => $eligibilityStart,
                'eligibility_end'     => $eligibilityEnd,
                'last_paid_info'      => $lastPaidInfo,   // null or array with distribution_no, period_end
                'adjustment_reason'   => $this->buildAdjustmentReason($selectedStart, $effectiveStart, $lastPaidInfo, $eligibilityStart),
            ]);
        }

        return $results;
    }

    /**
     * Group resolved partners by their unique (effective_start, effective_end) pair.
     * Partners sharing the same Effective Period reuse the same Financial Summary computation.
     *
     * @param  Collection $resolvedPeriods  Output of resolveAll()
     * @return Collection  Keyed by "start|end" → ['effective_start', 'effective_end', 'partner_ids']
     */
    public function groupByEffectivePeriod(Collection $resolvedPeriods): Collection
    {
        $groups = collect();

        foreach ($resolvedPeriods as $partnerId => $info) {
            if (! $info['is_eligible']) {
                continue;
            }

            $key = $info['effective_start'] . '|' . $info['effective_end'];

            if (! $groups->has($key)) {
                $groups->put($key, [
                    'effective_start' => $info['effective_start'],
                    'effective_end'   => $info['effective_end'],
                    'partner_ids'     => [],
                ]);
            }

            $group                  = $groups->get($key);
            $group['partner_ids'][] = $partnerId;
            $groups->put($key, $group);
        }

        return $groups;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Get active eligibility windows for each partner that overlap with the selected period.
     * Returns only the FIRST active record per partner (one active per partner is enforced by service).
     */
    private function getEligibilityWindows(array $partnerIds, string $selectedStart, string $selectedEnd): Collection
    {
        $rows = DB::table('partner_profit_eligibilities')
            ->whereIn('partner_id', $partnerIds)
            ->where('status', 'active')
            // Eligibility record must overlap with the selected period
            ->where('profit_start_date', '<=', $selectedEnd)
            ->where(function ($q) use ($selectedStart) {
                $q->whereNull('profit_end_date')
                  ->orWhere('profit_end_date', '>=', $selectedStart);
            })
            ->orderBy('partner_id')
            ->orderBy('profit_start_date')
            ->get(['partner_id', 'profit_start_date', 'profit_end_date']);

        // Key by partner_id (first active record wins — one active enforced at service layer)
        return $rows->keyBy('partner_id')->map(fn($row) => [
            'profit_start_date' => $row->profit_start_date,
            'profit_end_date'   => $row->profit_end_date,
        ]);
    }

    /**
     * For each partner, find the latest period_end among prior distributions
     * where that partner's item was settled (paid / reinvested / deferred)
     * AND the distribution period overlaps with the selected period.
     *
     * Returns: partner_id → ['paid_up_to' => date, 'paid_up_to_next_day' => date, 'distribution_no' => string]
     */
    private function getLastPaidUpTo(
        array $partnerIds,
        string $selectedStart,
        string $selectedEnd,
        ?int $excludeDistributionId
    ): Collection {
        $query = DB::table('profit_distribution_items as pdi')
            ->join('profit_distributions as pd', 'pd.id', '=', 'pdi.profit_distribution_id')
            ->whereIn('pdi.partner_id', $partnerIds)
            ->whereIn('pdi.payment_status', ['paid', 'reinvested', 'deferred'])
            ->whereIn('pd.status', ['approved', 'distributed'])
            ->whereNull('pd.deleted_at')
            // Overlap check: existing period overlaps with selected period
            ->where('pd.period_start', '<=', $selectedEnd)
            ->where('pd.period_end', '>=', $selectedStart);

        if ($excludeDistributionId) {
            $query->where('pd.id', '!=', $excludeDistributionId);
        }

        $rows = $query
            ->orderBy('pdi.partner_id')
            ->orderByDesc('pd.period_end')
            ->get(['pdi.partner_id', 'pd.period_end', 'pd.distribution_no']);

        // For each partner, keep only the row with the latest period_end
        return $rows
            ->groupBy('partner_id')
            ->map(function ($group) {
                $latest = $group->first(); // already ordered by period_end DESC
                $paidUpTo = $latest->period_end;

                return [
                    'paid_up_to'           => $paidUpTo,
                    'paid_up_to_next_day'  => date('Y-m-d', strtotime($paidUpTo . ' +1 day')),
                    'distribution_no'      => $latest->distribution_no,
                ];
            });
    }

    /**
     * Build a human-readable note explaining why the effective period differs from the selected period.
     */
    private function buildAdjustmentReason(
        string $selectedStart,
        string $effectiveStart,
        ?array $lastPaidInfo,
        string $eligibilityStart
    ): ?string {
        if ($effectiveStart === $selectedStart) {
            return null; // No adjustment — full selected period applies
        }

        $reasons = [];

        if ($lastPaidInfo && $lastPaidInfo['paid_up_to_next_day'] > $selectedStart) {
            $reasons[] = date('M j', strtotime($lastPaidInfo['paid_up_to']))
                . ' already paid via ' . $lastPaidInfo['distribution_no'];
        }

        if ($eligibilityStart > $selectedStart) {
            $reasons[] = 'Eligibility starts ' . date('M j', strtotime($eligibilityStart));
        }

        return implode('; ', $reasons) ?: null;
    }

    /**
     * Build a standardized ineligible result array.
     */
    private function ineligibleResult(
        int $partnerId,
        string $reason,
        ?string $effectiveStart = null,
        ?string $effectiveEnd   = null,
        ?array  $lastPaidInfo   = null
    ): array {
        return [
            'partner_id'        => $partnerId,
            'is_eligible'       => false,
            'effective_start'   => $effectiveStart,
            'effective_end'     => $effectiveEnd,
            'selected_start'    => null,
            'selected_end'      => null,
            'eligibility_start' => null,
            'eligibility_end'   => null,
            'last_paid_info'    => $lastPaidInfo,
            'adjustment_reason' => $reason,
        ];
    }
}
