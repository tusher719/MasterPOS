<?php

namespace App\Imports;

use App\Models\ProductCategory;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithValidation;

class CategoryImport implements ToCollection, WithHeadingRow, SkipsEmptyRows, WithValidation
{
    private array      $results        = [];
    private bool       $isDryRun       = true;
    private Collection $existingNames;
    private Collection $allCategories;

    public function __construct(bool $isDryRun = true)
    {
        $this->isDryRun      = $isDryRun;
        $this->allCategories = ProductCategory::withTrashed()->pluck('id', 'name');
        $this->existingNames = ProductCategory::withTrashed()->pluck('name')
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

        if ($name === '') {
            $errors[] = 'Name is required.';
        } elseif ($this->existingNames->contains(strtolower($name))) {
            $errors[] = "Category \"{$name}\" already exists — skipped.";
        }

        // --- Parent resolution ---
        $parentName = trim($row['parent_category'] ?? '');
        $parentId   = null;
        if ($parentName !== '') {
            $parentId = $this->allCategories->get($parentName);
            if ($parentId === null) {
                $warnings[] = "Parent \"{$parentName}\" not found — will be created as top-level.";
            }
        }

        $isActive = $this->parseBool($row['is_active'] ?? 'Active');
        $status   = count($errors) > 0 ? 'error' : (count($warnings) > 0 ? 'warning' : 'success');

        if (!$this->isDryRun && $status !== 'error') {
            $created = ProductCategory::create([
                'name'      => $name,
                'parent_id' => $parentId,
                'is_active' => $isActive,
            ]);

            // Make this available for subsequent rows that reference it as parent
            $this->allCategories->put($name, $created->id);
            $this->existingNames->push(strtolower($name));
        }

        return [
            'row'      => $rowNumber,
            'status'   => $status,
            'data'     => ['name' => $name],
            'errors'   => $errors,
            'warnings' => $warnings,
        ];
    }

    public function rules(): array
    {
        return [];
    }

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
