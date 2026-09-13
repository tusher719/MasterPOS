<?php

namespace App\Exports;

use App\Models\PaymentMethod;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PaymentMethodExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles,
    ShouldAutoSize,
    WithTitle
{
    public function collection(): Collection
    {
        return PaymentMethod::orderBy('sort_order')->get();
    }

    public function headings(): array
    {
        return [
            'Name',
            'Type',
            'Charge Enabled',
            'Charge Type',
            'Charge Value',
            'Charge Label',
            'Sort Order',
            'Is Active',
        ];
    }

    public function map($method): array
    {
        return [
            $method->name,
            $method->type ?? 'mobile_banking',
            $method->charge_enabled ? 'Yes' : 'No',
            $method->online_charge_type ?? '',
            $method->online_charge_value,
            $method->charge_label ?? '',
            $method->sort_order,
            $method->is_active ? 'Active' : 'Inactive',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '4F46E5']],
            ],
        ];
    }

    public function title(): string
    {
        return 'Payment Methods';
    }
}
