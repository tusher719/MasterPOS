<?php

namespace App\Imports;

use App\Models\Unit;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithValidation;

class UnitImport implements ToCollection, WithHeadingRow, SkipsEmptyRows, WithValidation
{
    private array      $results       = [];
    private bool       $isDryRun      = true;
    private Collection $existingNames;

    public function __construct(bool $isDryRun = true)
    {
        $this->isDryRun      = $isDryRun;
        $this->existingNames = Unit::withTrashed()->pluck('name')
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

        $name         = trim($row['name'] ?? '');
        $abbreviation = trim($row['abbreviation'] ?? '');

        if ($name === '') {
            $errors[] = 'Name is required.';
        } elseif ($this->existingNames->contains(strtolower($name))) {
            $errors[] = "Unit \"{$name}\" already exists — skipped.";
        }

        if ($abbreviation === '') {
            $errors[] = 'Abbreviation is required.';
        }

        $isActive = $this->parseBool($row['is_active'] ?? 'Active');
        $status   = count($errors) > 0 ? 'error' : (count($warnings) > 0 ? 'warning' : 'success');

        if (!$this->isDryRun && $status !== 'error') {
            Unit::create([
                'name'         => $name,
                'abbreviation' => $abbreviation,
                'is_active'    => $isActive,
            ]);

            $this->existingNames->push(strtolower($name));
        }

        return [
            'row'      => $rowNumber,
            'status'   => $status,
            'data'     => ['name' => $name, 'abbreviation' => $abbreviation],
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
