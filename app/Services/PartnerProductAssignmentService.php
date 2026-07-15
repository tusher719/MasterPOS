<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\PartnerProductAssignment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;

class PartnerProductAssignmentService
{
    /**
     * Create a new pending assignment.
     * approved_by is null until explicitly approved — pending assignments
     * are invisible to the Phase 4F calculation engine.
     */
    public function create(Partner $partner, array $data): PartnerProductAssignment
    {
        return PartnerProductAssignment::create([
            'partner_id'           => $partner->id,
            'assignable_type'      => 'product',
            'assignable_id'        => $data['assignable_id'],
            'effective_from'       => $data['effective_from'],
            'effective_to'         => $data['effective_to'] ?? null,
            'cost_return_enabled'  => $data['cost_return_enabled'] ?? true,
            'profit_share_percent' => $data['profit_share_percent'],
            'is_active'            => true,
            'created_by'           => Auth::id(),
        ]);
    }

    /**
     * Update a pending assignment only.
     * Approved assignments cannot be edited — controller enforces this,
     * but service also guards as a safety net.
     */
    public function update(PartnerProductAssignment $assignment, array $data): PartnerProductAssignment
    {
        if ($assignment->is_approved) {
            throw new \RuntimeException('Approved assignments cannot be edited.');
        }

        $assignment->update([
            'assignable_id'        => $data['assignable_id'],
            'effective_from'       => $data['effective_from'],
            'effective_to'         => $data['effective_to'] ?? null,
            'cost_return_enabled'  => $data['cost_return_enabled'] ?? true,
            'profit_share_percent' => $data['profit_share_percent'],
        ]);

        return $assignment->fresh();
    }

    /**
     * Approve an assignment.
     * Uses forceFill()->save() — approved_by/approved_at excluded from $fillable (Rule 66).
     */
    public function approve(PartnerProductAssignment $assignment): PartnerProductAssignment
    {
        $assignment->approve(Auth::id());

        return $assignment->fresh();
    }

    /**
     * Delete a pending assignment only.
     * Approved assignments cannot be deleted — they must be deactivated instead.
     */
    public function delete(PartnerProductAssignment $assignment): void
    {
        if ($assignment->is_approved) {
            throw new \RuntimeException('Approved assignments cannot be deleted.');
        }

        $assignment->delete();
    }

    /**
     * Deactivate an approved assignment by setting effective_to = today.
     * Used when an assignment needs to end — never hard delete approved records.
     */
    public function deactivate(PartnerProductAssignment $assignment, string $endDate): PartnerProductAssignment
    {
        $assignment->update([
            'effective_to' => $endDate,
            'is_active'    => false,
        ]);

        return $assignment->fresh();
    }

    /**
     * Phase 4F helper — get all approved active assignments for a product on a given sale date.
     * Called directly by ProductBasedStrategy — do not duplicate this query elsewhere.
     */
    public function getAssignmentsForProduct(int $productId, string $saleDate): Collection
    {
        return PartnerProductAssignment::where('assignable_type', 'product')
            ->where('assignable_id', $productId)
            ->coveringSaleDate($saleDate)
            ->with('partner')
            ->get();
    }

    /**
     * Phase 4F helper — get all approved active assignments for a partner covering a full period.
     * Called by ProfitCalculationEngine when building partner preview.
     */
    public function getAssignmentsForPartner(int $partnerId, string $periodStart, string $periodEnd): Collection
    {
        return PartnerProductAssignment::where('partner_id', $partnerId)
            ->where('assignable_type', 'product')
            ->coveringPeriod($periodStart, $periodEnd)
            ->with('product:id,name,sku')
            ->get();
    }
}
