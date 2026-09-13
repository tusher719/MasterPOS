<?php

namespace App\Exports;

use App\Models\Product;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles,
    ShouldAutoSize,
    WithTitle
{
    public function __construct(
        private readonly ?string $search = null,
        private readonly ?string $category = null,
        private readonly ?string $status = null,
    ) {}

    public function collection(): Collection
    {
        return Product::with(['category', 'unit'])
            ->when($this->search, fn($q) => $q->where(function ($q) {
                $q->where('name', 'like', "%{$this->search}%")
                  ->orWhere('sku', 'like', "%{$this->search}%")
                  ->orWhere('barcode', 'like', "%{$this->search}%");
            }))
            ->when($this->category, fn($q) => $q->where('category_id', $this->category))
            ->when($this->status === 'active', fn($q) => $q->where('is_active', true))
            ->when($this->status === 'inactive', fn($q) => $q->where('is_active', false))
            ->orderBy('name')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Name',
            'SKU',
            'Barcode',
            'Category',
            'Unit',
            'Cost Price',
            'Sale Price',
            'Stock Qty',
            'Low Stock Threshold',
            'Min Sale Qty',
            'Is Taxable',
            'Is Featured',
            'Is Active',
            'Description',
        ];
    }

    public function map($product): array
    {
        return [
            $product->name,
            $product->sku,
            $product->barcode ?? '',
            $product->category?->name ?? '',
            $product->unit?->name ?? '',
            $product->cost_price,
            $product->sale_price,
            $product->stock_qty,
            $product->low_stock_threshold,
            $product->min_sale_qty,
            $product->is_taxable ? 'Yes' : 'No',
            $product->is_featured ? 'Yes' : 'No',
            $product->is_active ? 'Active' : 'Inactive',
            $product->description ?? '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'    => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill'    => ['fillType' => 'solid', 'startColor' => ['rgb' => '4F46E5']],
            ],
        ];
    }

    public function title(): string
    {
        return 'Products';
    }
}
