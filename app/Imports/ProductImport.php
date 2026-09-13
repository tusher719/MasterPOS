<?php

namespace App\Imports;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Unit;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithValidation;

class ProductImport implements ToCollection, WithHeadingRow, SkipsEmptyRows, WithValidation
{
    private array $results   = [];
    private bool  $isDryRun  = true;

    // Pre-loaded lookup maps to avoid N+1 queries
    private Collection $categories;
    private Collection $units;
    private array      $existingSkus;

    public function __construct(bool $isDryRun = true)
    {
        $this->isDryRun     = $isDryRun;
        $this->categories   = ProductCategory::where('is_active', true)->pluck('id', 'name');
        $this->units        = Unit::where('is_active', true)->pluck('id', 'name');
        $this->existingSkus = Product::withTrashed()->pluck('sku')->map(fn($s) => strtolower($s))->toArray();
    }

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2; // +2 because row 1 = heading
            $result    = $this->processRow($row->toArray(), $rowNumber);
            $this->results[] = $result;
        }
    }

    private function processRow(array $row, int $rowNumber): array
    {
        $errors   = [];
        $warnings = [];

        // --- Required field checks ---
        $name = trim($row['name'] ?? '');
        $sku  = trim($row['sku'] ?? '');

        if ($name === '') {
            $errors[] = 'Name is required.';
        }
        if ($sku === '') {
            $errors[] = 'SKU is required.';
        }

        // --- Duplicate SKU check ---
        if ($sku !== '' && in_array(strtolower($sku), $this->existingSkus, true)) {
            $errors[] = "SKU \"{$sku}\" already exists — skipped.";
        }

        // --- Category resolution ---
        $categoryName = trim($row['category'] ?? '');
        $categoryId   = null;
        if ($categoryName !== '') {
            $categoryId = $this->categories->get($categoryName);
            if ($categoryId === null) {
                $warnings[] = "Category \"{$categoryName}\" not found — will be left blank.";
            }
        } else {
            $warnings[] = 'No category specified.';
        }

        // --- Unit resolution ---
        $unitName = trim($row['unit'] ?? '');
        $unitId   = null;
        if ($unitName !== '') {
            $unitId = $this->units->get($unitName);
            if ($unitId === null) {
                $warnings[] = "Unit \"{$unitName}\" not found — will be left blank.";
            }
        }

        // --- Numeric field validation ---
        $costPrice = $this->parseDecimal($row['cost_price'] ?? 0);
        $salePrice = $this->parseDecimal($row['sale_price'] ?? 0);

        if ($costPrice < 0) {
            $errors[] = 'Cost price cannot be negative.';
        }
        if ($salePrice <= 0) {
            $errors[] = 'Sale price must be greater than 0.';
        }

        $stockQty          = $this->parseDecimal($row['stock_qty'] ?? 0);
        $lowStockThreshold = $this->parseDecimal($row['low_stock_threshold'] ?? 0);
        $minSaleQty        = max(1, $this->parseDecimal($row['min_sale_qty'] ?? 1));
        $isActive          = $this->parseBool($row['is_active'] ?? 'Active');

        $status = count($errors) > 0 ? 'error' : (count($warnings) > 0 ? 'warning' : 'success');

        // --- Persist if commit mode and no hard errors ---
        if (!$this->isDryRun && $status !== 'error') {
            $slug = Str::slug($name) . '-' . Str::lower(Str::random(6));

            Product::create([
                'name'                => $name,
                'sku'                 => $sku,
                'barcode'             => trim($row['barcode'] ?? '') ?: null,
                'category_id'         => $categoryId,
                'unit_id'             => $unitId,
                'cost_price'          => $costPrice,
                'sale_price'          => $salePrice,
                'stock_qty'           => $stockQty,
                'low_stock_threshold' => $lowStockThreshold,
                'min_sale_qty'        => $minSaleQty,
                'is_taxable'          => $this->parseBool($row['is_taxable'] ?? 'No'),
                'is_featured'         => $this->parseBool($row['is_featured'] ?? 'No'),
                'is_active'           => $isActive,
                'description'         => trim($row['description'] ?? '') ?: null,
                'slug'                => $slug,
                'average_cost'        => $costPrice,
            ]);

            // Add to in-memory list so subsequent rows in same import detect this SKU
            $this->existingSkus[] = strtolower($sku);
        }

        return [
            'row'      => $rowNumber,
            'status'   => $status,
            'data'     => ['name' => $name, 'sku' => $sku],
            'errors'   => $errors,
            'warnings' => $warnings,
        ];
    }

    public function rules(): array
    {
        // WithValidation provides early row-level rejection before collection() runs
        return [];
    }

    // --- Helpers ---

    private function parseDecimal(mixed $value): float
    {
        return max(0, (float) str_replace(',', '', (string) $value));
    }

    private function parseBool(mixed $value): bool
    {
        $val = strtolower(trim((string) $value));
        return in_array($val, ['yes', 'true', '1', 'active'], true);
    }

    public function getResults(): array
    {
        return $this->results;
    }

    public function getSummary(): array
    {
        $total    = count($this->results);
        $success  = count(array_filter($this->results, fn($r) => $r['status'] === 'success'));
        $warnings = count(array_filter($this->results, fn($r) => $r['status'] === 'warning'));
        $errors   = count(array_filter($this->results, fn($r) => $r['status'] === 'error'));

        return compact('total', 'success', 'warnings', 'errors');
    }
}
