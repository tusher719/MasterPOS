<?php

namespace App\Services\ProfitCalculation;

/**
 * Data Transfer Object — represents one unique Effective Period group.
 *
 * Partners sharing the same (effective_start, effective_end) pair are grouped here
 * so that Financial Summary (Revenue, COGS, Expenses) is computed ONCE per group,
 * not once per partner.
 *
 * Usage flow:
 *   1. PartnerPeriodResolutionService::groupByEffectivePeriod() creates these DTOs
 *   2. ProfitCalculationEngine iterates groups → computes Financial Summary once per group
 *   3. Each partner in the group receives the same Financial Summary
 *   4. Strategy (FixedPercent / ProductBased / Mixed) runs per partner using that summary
 */
class EffectivePeriodGroup
{
    /**
     * @param  string     $effectiveStart   Y-m-d — start of this group's effective period
     * @param  string     $effectiveEnd     Y-m-d — end of this group's effective period
     * @param  array      $partnerIds       Partner IDs sharing this effective period
     * @param  array|null $financialSummary Computed once by engine — null until engine fills it
     *                                      Keys: total_revenue, total_cogs, total_expenses,
     *                                            gross_profit, net_profit
     */
    public function __construct(
        public readonly string $effectiveStart,
        public readonly string $effectiveEnd,
        public readonly array  $partnerIds,
        public ?array          $financialSummary = null,
    ) {}

    /**
     * Build from the raw array produced by PartnerPeriodResolutionService::groupByEffectivePeriod().
     */
    public static function fromArray(array $data): self
    {
        return new self(
            effectiveStart: $data['effective_start'],
            effectiveEnd:   $data['effective_end'],
            partnerIds:     $data['partner_ids'],
        );
    }

    /**
     * Unique key for this group — used as Collection key and for deduplication.
     */
    public function key(): string
    {
        return $this->effectiveStart . '|' . $this->effectiveEnd;
    }

    /**
     * Check whether the Financial Summary has been computed for this group.
     */
    public function hasSummary(): bool
    {
        return $this->financialSummary !== null;
    }

    /**
     * Attach the computed Financial Summary to this group.
     * Called by ProfitCalculationEngine after it runs the period query.
     */
    public function attachSummary(array $summary): void
    {
        $this->financialSummary = $summary;
    }

    /**
     * Convenience accessor — gross profit for this effective period.
     */
    public function grossProfit(): float
    {
        return (float) ($this->financialSummary['gross_profit'] ?? 0);
    }

    /**
     * Convenience accessor — net profit for this effective period.
     */
    public function netProfit(): float
    {
        return (float) ($this->financialSummary['net_profit'] ?? 0);
    }

    /**
     * Convenience accessor — distributable amount given a distribution_percent.
     */
    public function distributableAmount(float $distributionPercent): float
    {
        return round($this->netProfit() * ($distributionPercent / 100), 2);
    }

    /**
     * Serialize to array for engine output / JSON response.
     */
    public function toArray(): array
    {
        return [
            'effective_start'    => $this->effectiveStart,
            'effective_end'      => $this->effectiveEnd,
            'partner_ids'        => $this->partnerIds,
            'financial_summary'  => $this->financialSummary,
        ];
    }
}
