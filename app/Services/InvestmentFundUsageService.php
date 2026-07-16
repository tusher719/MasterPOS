<?php

namespace App\Services;

use App\Models\CapitalLedgerEntry;
use App\Models\Expense;
use App\Models\InvestmentFundUsage;
use App\Models\Purchase;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class InvestmentFundUsageService
{
    // ─── Helpers ──────────────────────────────────────────────────

    /**
     * Total amount already linked from this entry.
     */
    public function linkedAmount(CapitalLedgerEntry $entry): float
    {
        return (float) InvestmentFundUsage::forEntry($entry->id)->sum('amount');
    }

    /**
     * Remaining linkable amount for this entry.
     */
    public function remainingAmount(CapitalLedgerEntry $entry): float
    {
        return max(0, (float) $entry->amount - $this->linkedAmount($entry));
    }

    /**
     * Resolve usable model (Purchase or Expense) with withTrashed support.
     */
    public function resolveUsable(string $usableType, int $usableId): Purchase|Expense
    {
        return match ($usableType) {
            'purchase' => Purchase::withTrashed()->findOrFail($usableId),
            'expense'  => Expense::withTrashed()->findOrFail($usableId),
            default    => throw new RuntimeException("Invalid usable_type: {$usableType}"),
        };
    }

    // ─── Validation Guards ────────────────────────────────────────

    /**
     * Entry must be an approved withdrawal.
     */
    public function assertEntryIsApprovedWithdrawal(CapitalLedgerEntry $entry): void
    {
        if ($entry->transaction_type !== 'withdrawal') {
            throw new RuntimeException('Fund usage can only be linked to withdrawal entries.');
        }

        if ($entry->status !== 'approved') {
            throw new RuntimeException('Fund usage can only be linked to approved withdrawals.');
        }
    }

    /**
     * Usable record must not already be linked to a fund usage.
     */
    public function assertUsableNotAlreadyLinked(string $usableType, int $usableId): void
    {
        $exists = InvestmentFundUsage::where('usable_type', $usableType)
            ->where('usable_id', $usableId)
            ->exists();

        if ($exists) {
            throw new RuntimeException(
                ucfirst($usableType) . ' #' . $usableId . ' is already linked to a fund usage.'
            );
        }
    }

    /**
     * Requested amount must not exceed remaining linkable amount.
     */
    public function assertAmountWithinLimit(CapitalLedgerEntry $entry, float $amount): void
    {
        $remaining = $this->remainingAmount($entry);

        if ($amount > $remaining) {
            throw new RuntimeException(
                "Amount {$amount} exceeds remaining linkable amount {$remaining}."
            );
        }
    }

    // ─── CRUD ─────────────────────────────────────────────────────

    public function create(CapitalLedgerEntry $entry, array $data): InvestmentFundUsage
    {
        $this->assertEntryIsApprovedWithdrawal($entry);
        $this->assertUsableNotAlreadyLinked($data['usable_type'], (int) $data['usable_id']);
        $this->assertAmountWithinLimit($entry, (float) $data['amount']);

        // Resolve usable to confirm it exists
        $this->resolveUsable($data['usable_type'], (int) $data['usable_id']);

        return DB::transaction(function () use ($entry, $data) {
            $usage = InvestmentFundUsage::create([
                'capital_ledger_entry_id' => $entry->id,
                'partner_id'              => $entry->partner_id ?? null,
                'usable_type'             => $data['usable_type'],
                'usable_id'               => (int) $data['usable_id'],
                'amount'                  => (float) $data['amount'],
                'note'                    => $data['note'] ?? null,
                'created_by'              => Auth::id(),
            ]);

            ActivityLogService::log(
                'investment_fund_usage',
                'create',
                "Linked {$data['usable_type']} #{$data['usable_id']} to capital ledger entry #{$entry->id} for amount {$data['amount']}",
                $usage,
                [
                    'usable_type' => $data['usable_type'],
                    'usable_id'   => $data['usable_id'],
                    'amount'      => $data['amount'],
                ]
            );

            return $usage;
        });
    }

    public function delete(InvestmentFundUsage $usage): void
    {
        DB::transaction(function () use ($usage) {
            ActivityLogService::log(
                'investment_fund_usage',
                'delete',
                "Unlinked {$usage->usable_type} #{$usage->usable_id} from capital ledger entry #{$usage->capital_ledger_entry_id}",
                $usage,
                [
                    'usable_type' => $usage->usable_type,
                    'usable_id'   => $usage->usable_id,
                    'amount'      => $usage->amount,
                ]
            );

            $usage->delete();
        });
    }

    // ─── Display Helpers ──────────────────────────────────────────

    /**
     * Load fund usages for an entry with usable titles resolved.
     */
    public function getUsagesForEntry(CapitalLedgerEntry $entry): array
    {
        $usages = InvestmentFundUsage::forEntry($entry->id)
            ->with(['createdBy:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return $usages->map(function (InvestmentFundUsage $usage) {
            $title = $this->resolveUsableTitle($usage->usable_type, $usage->usable_id);

            return [
                'id'                       => $usage->id,
                'capital_ledger_entry_id'  => $usage->capital_ledger_entry_id,
                'usable_type'              => $usage->usable_type,
                'usable_id'                => $usage->usable_id,
                'usable_label'             => $usage->usable_label,
                'usable_title'             => $title,
                'amount'                   => $usage->amount,
                'note'                     => $usage->note,
                'created_by_name'          => $usage->createdBy?->name ?? 'Unknown',
                'created_at'               => $usage->created_at?->format('Y-m-d H:i'),
            ];
        })->toArray();
    }

    /**
     * Resolve a human-readable title for a usable record.
     */
    private function resolveUsableTitle(string $usableType, int $usableId): string
    {
        try {
            $model = $this->resolveUsable($usableType, $usableId);

            return match ($usableType) {
                'purchase' => $model->reference_no ?? "Purchase #{$usableId}",
                'expense'  => $model->title ?? "Expense #{$usableId}",
                default    => "{$usableType} #{$usableId}",
            };
        } catch (\Throwable) {
            return "{$usableType} #{$usableId} (deleted)";
        }
    }

    // ─── Dropdown Options ─────────────────────────────────────────

    /**
     * Get purchases available for linking (not already linked).
     */
    public function getAvailablePurchases(): array
    {
        $linkedIds = InvestmentFundUsage::purchases()->pluck('usable_id')->toArray();

        return Purchase::whereNotIn('id', $linkedIds)
            ->orderBy('purchase_date', 'desc')
            ->limit(100)
            ->get(['id', 'reference_no', 'purchase_date', 'grand_total'])
            ->map(fn($p) => [
                'id'            => $p->id,
                'label'         => $p->reference_no . ' — ' . number_format((float) $p->grand_total, 2) . ' BDT',
                'grand_total'   => (float) $p->grand_total,
                'purchase_date' => $p->purchase_date,
            ])
            ->toArray();
    }

    /**
     * Get expenses available for linking (not already linked).
     */
    public function getAvailableExpenses(): array
    {
        $linkedIds = InvestmentFundUsage::expenses()->pluck('usable_id')->toArray();

        return Expense::whereNotIn('id', $linkedIds)
            ->orderBy('expense_date', 'desc')
            ->limit(100)
            ->get(['id', 'title', 'expense_date', 'amount'])
            ->map(fn($e) => [
                'id'           => $e->id,
                'label'        => $e->title . ' — ' . number_format((float) $e->amount, 2) . ' BDT',
                'amount'       => (float) $e->amount,
                'expense_date' => $e->expense_date,
            ])
            ->toArray();
    }
}
