<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderTask extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'customer_name_snapshot',
        'customer_phone_snapshot',
        'source',
        'priority',
        'due_date',
        'note',
        'assignment_type',
        'assigned_to',
        'linked_sale_id',
        'created_by',
        'completed_by',
        'completed_at',
        'started_at',
    ];

    // claimed_by, claimed_at, status excluded from $fillable (Rule 66)
    // These are set only via atomic claim guard or explicit model methods

    protected $casts = [
        'due_date'     => 'date',
        'claimed_at'   => 'datetime',
        'completed_at' => 'datetime',
        'started_at'   => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to')->withTrashed();
    }

    public function claimedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'claimed_by')->withTrashed();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by')->withTrashed();
    }

    public function linkedSale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'linked_sale_id')->withTrashed();
    }

    // -------------------------------------------------------------------------
    // Status helpers
    // -------------------------------------------------------------------------

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isClaimed(): bool
    {
        return $this->status === 'claimed';
    }

    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    public function isReady(): bool
    {
        return $this->status === 'ready';
    }

    public function isConverted(): bool
    {
        return $this->status === 'converted_to_sale';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, ['converted_to_sale', 'cancelled']);
    }

    public function isClaimable(): bool
    {
        // Open tasks with no existing claim can be claimed
        return $this->assignment_type === 'open'
            && $this->claimed_by === null
            && $this->status === 'pending';
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeBySource($query, string $source)
    {
        return $query->where('source', $source);
    }

    public function scopeByAssignmentType($query, string $type)
    {
        return $query->where('assignment_type', $type);
    }

    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    public function scopeClaimedBy($query, int $userId)
    {
        return $query->where('claimed_by', $userId);
    }

    public function scopeOverdue($query)
    {
        return $query->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->whereNotIn('status', ['converted_to_sale', 'cancelled']);
    }
}
