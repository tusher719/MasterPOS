<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportLog extends Model
{
    protected $fillable = [
        'module',
        'type',
        'format',
        'filename',
        'total_rows',
        'imported_rows',
        'skipped_rows',
        'failed_rows',
        'row_results',
        'status',
        'imported_by',
    ];

    protected $casts = [
        'total_rows'    => 'integer',
        'imported_rows' => 'integer',
        'skipped_rows'  => 'integer',
        'failed_rows'   => 'integer',
        'row_results'   => 'array',  // auto JSON encode/decode
    ];

    // ── Module display labels ─────────────────────────────────────────────────

    public const MODULE_LABELS = [
        'products'           => 'Products',
        'categories'         => 'Categories',
        'units'              => 'Units',
        'customers'          => 'Customers',
        'suppliers'          => 'Suppliers',
        'expense_categories' => 'Expense Categories',
        'payment_methods'    => 'Payment Methods',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    public function importedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by')->withTrashed();
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function getModuleLabelAttribute(): string
    {
        return self::MODULE_LABELS[$this->module] ?? ucfirst($this->module);
    }

    public function getSuccessRateAttribute(): int
    {
        if ($this->total_rows === 0) {
            return 0;
        }

        return (int) round(($this->imported_rows / $this->total_rows) * 100);
    }

    public function getIsImportAttribute(): bool
    {
        return $this->type === 'import';
    }

    public function getIsExportAttribute(): bool
    {
        return $this->type === 'export';
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeImports($query)
    {
        return $query->where('type', 'import');
    }

    public function scopeExports($query)
    {
        return $query->where('type', 'export');
    }

    public function scopeForUser($query, int $userId, bool $isAdmin)
    {
        if (!$isAdmin) {
            $query->where('imported_by', $userId);
        }

        return $query;
    }
}
