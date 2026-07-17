<?php

// app/Models/CapitalLedgerEntry.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Auth;

class CapitalLedgerEntry extends Model
{
    protected $fillable = [
        'investment_id',
        'investor_name',
        'partner_id',
        'transaction_type',
        'direction',
        'amount',
        'running_balance',
        'reference_no',
        'source_type',
        'source_id',
        'reason',
        'note',
        'status',
        'created_by',
        'requested_by',
    ];

    // Status fields excluded from mass assignment — use forceFill()->save()
    // status, approved_by, approved_at

    protected $casts = [
        'amount'          => 'decimal:2',
        'running_balance' => 'decimal:2',
        'approved_at'     => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class)->withTrashed();
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class)->withTrashed();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by')->withTrashed();
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by')->withTrashed();
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }
    public function fundUsages(): HasMany
    {
        return $this->hasMany(InvestmentFundUsage::class, 'capital_ledger_entry_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForInvestment($query, int $investmentId)
    {
        return $query->where('investment_id', $investmentId);
    }

    public function scopePendingWithdrawals($query)
    {
        return $query->where('transaction_type', 'withdrawal')
                     ->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    // ─── Reference Number Generator ───────────────────────────────────────────

    public static function generateReferenceNo(): string
    {
        $date   = now()->format('Ymd');
        $prefix = 'CL-' . $date . '-';

        $last = static::where('reference_no', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByDesc('reference_no')
            ->value('reference_no');

        $next = $last
            ? (int) substr($last, -4) + 1
            : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    // ─── Status Transition Helpers ────────────────────────────────────────────

    public function markAsApproved(int $approvedBy): void
    {
        $this->forceFill([
            'status'      => 'approved',
            'approved_by' => $approvedBy,
            'approved_at' => now(),
        ])->save();
    }

    public function markAsRejected(): void
    {
        $this->forceFill(['status' => 'rejected'])->save();
    }

    public function markAsCancelled(): void
    {
        $this->forceFill(['status' => 'cancelled'])->save();
    }

    // ─── State Checks ─────────────────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isCancellable(): bool
    {
        return $this->status === 'pending';
    }
}
