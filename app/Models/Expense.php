<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'reference_no',
        'title',
        'expense_category_id',
        'payment_method_id',
        'amount',
        'expense_date',
        'reference',
        'attachment',
        'note',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'expense_date' => 'date',
    ];

    // -------------------------------------------------------------------------
    // Reference number generator: EX-YYYYMMDD-XXXX
    // -------------------------------------------------------------------------
    public static function generateReference(): string
    {
        $prefix = 'EX-' . now()->format('Ymd') . '-';
        $last   = static::withTrashed()
                         ->where('reference_no', 'like', $prefix . '%')
                         ->orderByDesc('id')
                         ->value('reference_no');

        $next = $last ? (int) substr($last, -4) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------
    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id')
                    ->withTrashed();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')
                    ->withTrashed();
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by')
                    ->withTrashed();
    }

    // -------------------------------------------------------------------------
    // Attachment helper — returns public URL or null
    // -------------------------------------------------------------------------
    public function getAttachmentUrlAttribute(): ?string
    {
        return $this->attachment
            ? asset('storage/' . $this->attachment)
            : null;
    }

    // -------------------------------------------------------------------------
    // Attachment MIME helper — used by Show page to decide preview vs download
    // -------------------------------------------------------------------------
    public function getAttachmentMimeAttribute(): ?string
    {
        if (! $this->attachment) {
            return null;
        }

        $ext = strtolower(pathinfo($this->attachment, PATHINFO_EXTENSION));

        return match ($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png'         => 'image/png',
            'gif'         => 'image/gif',
            'pdf'         => 'application/pdf',
            'doc'         => 'application/msword',
            'docx'        => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            default       => 'application/octet-stream',
        };
    }
}
