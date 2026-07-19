<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\PartnerProfitRule;
use Illuminate\Support\Collection;

class PartnerRuleResolutionService
{
    /**
     * Resolve the correct profit rule for a partner at a given period_start date.
     * Only approved rules are considered — pending rules are invisible.
     *
     * Resolution logic:
     *   effective_from <= $periodStart
     *   AND (effective_to IS NULL OR effective_to >= $periodStart)
     *   AND approved_by IS NOT NULL
     *
     * Returns the most recent matching rule (highest effective_from).
     */
    public function resolve(int $partnerId, string $periodStart): ?PartnerProfitRule
    {
        return PartnerProfitRule::where('partner_id', $partnerId)
            ->activeAt($periodStart)
            ->orderByDesc('effective_from')
            ->first();
    }

    /**
     * Resolve rules for multiple partners at once.
     * Returns a keyed collection: partner_id => PartnerProfitRule|null
     *
     * Used by the calculation engine to batch-load rules for all partners
     * in a distribution without N+1 queries.
     */
    public function resolveForPartners(array $partnerIds, string $periodStart): Collection
    {
        if (empty($partnerIds)) {
            return collect();
        }

        // Fetch all matching rules for all partners in one query
        $rules = PartnerProfitRule::whereIn('partner_id', $partnerIds)
            ->activeAt($periodStart)
            ->orderByDesc('effective_from')
            ->get();

        // Key by partner_id — first() per partner since ordered by effective_from desc
        $resolved = collect();

        foreach ($partnerIds as $partnerId) {
            $resolved[$partnerId] = $rules->firstWhere('partner_id', $partnerId);
        }

        return $resolved;
    }

    /**
     * Check if a partner has any approved active rule.
     * Used for validation before creating a distribution.
     */
    public function hasActiveRule(int $partnerId, string $periodStart): bool
    {
        return $this->resolve($partnerId, $periodStart) !== null;
    }

    /**
     * Get the full rule history for a partner — all versions ordered chronologically.
     * Used for display in RuleHistoryDrawer.
     */
    public function getRuleHistory(int $partnerId): Collection
    {
        return PartnerProfitRule::where('partner_id', $partnerId)
            ->with(['history.changedBy', 'approvedBy', 'createdBy'])
            ->orderBy('effective_from', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Validate that a profit_source is compatible with the partner's type flags.
     *
     * Mapping:
     *   capital_share  → partner_type_capital must be true
     *   working_share  → partner_type_working must be true
     *   product_share  → partner_type_product must be true
     *   custom         → always allowed
     *
     * Returns an error message string if invalid, null if valid.
     */
    public function validateProfitSourceForPartner(Partner $partner, string $profitSource): ?string
    {
        return match ($profitSource) {
            'capital_share' => $partner->partner_type_capital
                ? null
                : 'This partner is not a Capital type. Capital Share rules require the partner to have the Capital type enabled.',

            'working_share' => $partner->partner_type_working
                ? null
                : 'This partner is not a Working type. Working Share rules require the partner to have the Working type enabled.',

            'product_share' => $partner->partner_type_product
                ? null
                : 'This partner is not a Product type. Product Share rules require the partner to have the Product type enabled.',

            'custom' => null,

            default => 'Invalid profit source.',
        };
    }
}
