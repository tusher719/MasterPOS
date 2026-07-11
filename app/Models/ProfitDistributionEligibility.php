<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfitDistributionEligibility extends Model
{
    protected $fillable = [
        'profit_distribution_id',
        'investment_id',
        'investor_name',
        'is_eligible',
        'eligibility_reason',
        'override_by',
        'override_at',
    ];

    protected $casts = [
        'is_eligible'  => 'boolean',
        'override_at'  => 'datetime',
    ];

    // ─── Relations ───────────────────────────────────────────

    public function distribution(): BelongsTo
    {
        return $this->belongsTo(ProfitDistribution::class, 'profit_distribution_id');
    }

    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class)->withTrashed();
    }

    public function overriddenBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'override_by')->withTrashed();
    }

    // ─── Helpers ─────────────────────────────────────────────

    /**
     * Determine eligibility automatically based on investment_date vs period_start.
     * Admin can override this via override_by + override_at.
     */
    public static function determineEligibility(
        Investment $investment,
        string $periodStart
    ): bool {
        return $investment->investment_date <= $periodStart;
    }

    public function isManualOverride(): bool
    {
        return $this->override_by !== null;
    }
}
