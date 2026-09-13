<?php

namespace App\Imports;

use App\Models\Supplier;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithValidation;

class SupplierImport implements ToCollection, WithHeadingRow, SkipsEmptyRows, WithValidation
{
    private array      $results        = [];
    private bool       $isDryRun       = true;
    private Collection $existingEmails;

    public function __construct(bool $isDryRun = true)
    {
        $this->isDryRun       = $isDryRun;
        $this->existingEmails = Supplier::withTrashed()->whereNotNull('email')
            ->pluck('email')->map(fn($e) => strtolower($e));
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

        $name  = trim($row['name'] ?? '');
        $email = strtolower(trim($row['email'] ?? ''));

        if ($name === '') {
            $errors[] = 'Name is required.';
        }

        if ($email !== '') {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Invalid email address: \"{$email}\".";
            } elseif ($this->existingEmails->contains($email)) {
                $errors[] = "Email \"{$email}\" already exists — skipped.";
            }
        }

        $openingBalance = max(0, (float) str_replace(',', '', (string) ($row['opening_balance'] ?? 0)));
        $isActive       = $this->parseBool($row['is_active'] ?? 'Active');
        $status         = count($errors) > 0 ? 'error' : (count($warnings) > 0 ? 'warning' : 'success');

        if (!$this->isDryRun && $status !== 'error') {
            Supplier::create([
                'name'            => $name,
                'company'         => trim($row['company'] ?? '') ?: null,
                'email'           => $email ?: null,
                'phone'           => trim($row['phone'] ?? '') ?: null,
                'address'         => trim($row['address'] ?? '') ?: null,
                'city'            => trim($row['city'] ?? '') ?: null,
                'country'         => trim($row['country'] ?? '') ?: 'Bangladesh',
                'opening_balance' => $openingBalance,
                'is_active'       => $isActive,
            ]);

            if ($email !== '') $this->existingEmails->push($email);
        }

        return [
            'row'      => $rowNumber,
            'status'   => $status,
            'data'     => ['name' => $name, 'email' => $email],
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
