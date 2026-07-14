<?php

namespace App\Services;

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
}
