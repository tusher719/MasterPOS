<?php

namespace App\Imports;

use App\Models\PaymentMethod;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithValidation;

class PaymentMethodImport implements ToCollection, WithHeadingRow, SkipsEmptyRows, WithValidation
{
    private array      $results       = [];
    private bool       $isDryRun      = true;
    private Collection $existingNames;

    private const VALID_TYPES        = ['mobile_banking', 'bank_transfer', 'cash'];
    private const VALID_CHARGE_TYPES = ['percent', 'fixed'];

    public function __construct(bool $isDryRun = true)
    {
        $this->isDryRun      = $isDryRun;
        $this->existingNames = PaymentMethod::pluck('name')
            ->map(fn($n) => strtolower($n));
    }

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $this->results[] = $this->processRow($row->toArray(), $index + 2);
        }
    }

    private function processRow(array $row, int $rowNumber): array
    {
        $errors   = [];
        $warnings = [];

        $name = trim($row['name'] ?? '');
        $type = strtolower(trim($row['type'] ?? 'mobile_banking'));

        if ($name === '') {
            $errors[] = 'Name is required.';
        } elseif ($this->existingNames->contains(strtolower($name))) {
            $errors[] = "Payment method \"{$name}\" already exists — skipped.";
        }

        // Validate type
        if (!in_array($type, self::VALID_TYPES, true)) {
            $warnings[] = "Type \"{$type}\" is invalid — defaulting to \"mobile_banking\".";
            $type = 'mobile_banking';
        }

        // Charge fields
        $chargeEnabled = $this->parseBool($row['charge_enabled'] ?? 'No');
        $chargeType    = strtolower(trim($row['charge_type'] ?? ''));
        $chargeValue   = max(0, (float) ($row['charge_value'] ?? 0));

        if ($chargeEnabled && $chargeType !== '' && !in_array($chargeType, self::VALID_CHARGE_TYPES, true)) {
            $warnings[] = "Charge type \"{$chargeType}\" is invalid — charge will be disabled.";
            $chargeEnabled = false;
            $chargeType    = null;
        }

        $sortOrder = max(0, (int) ($row['sort_order'] ?? 0));
        $isActive  = $this->parseBool($row['is_active'] ?? 'Active');
        $status    = count($errors) > 0 ? 'error' : (count($warnings) > 0 ? 'warning' : 'success');

        if (!$this->isDryRun && $status !== 'error') {
            PaymentMethod::create([
                'name'                => $name,
                'type'                => $type,
                'charge_enabled'      => $chargeEnabled,
                'online_charge_type'  => $chargeEnabled ? ($chargeType ?: null) : null,
                'online_charge_value' => $chargeEnabled ? $chargeValue : 0,
                'charge_label'        => trim($row['charge_label'] ?? '') ?: null,
                'sort_order'          => $sortOrder,
                'is_active'           => $isActive,
            ]);

            $this->existingNames->push(strtolower($name));
        }

        return [
            'row'      => $rowNumber,
            'status'   => $status,
            'data'     => ['name' => $name, 'type' => $type],
            'errors'   => $errors,
            'warnings' => $warnings,
        ];
    }

    public function rules(): array { return []; }

    private function parseBool(mixed $value): bool
    {
        return in_array(strtolower(trim((string) $value)), ['yes', 'true', '1', 'active'], true);
    }

    public function getResults(): array { return $this->results; }

    public function getSummary(): array
    {
        $total    = count($this->results);
        $success  = count(array_filter($this->results, fn($r) => $r['status'] === 'success'));
        $warnings = count(array_filter($this->results, fn($r) => $r['status'] === 'warning'));
        $errors   = count(array_filter($this->results, fn($r) => $r['status'] === 'error'));

        return compact('total', 'success', 'warnings', 'errors');
    }
}
