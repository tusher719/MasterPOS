<?php

// database/seeders/InvestorCapitalBalanceSeeder.php

namespace Database\Seeders;

use App\Models\CapitalLedgerEntry;
use App\Models\Investment;
use App\Models\InvestorCapitalBalance;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InvestorCapitalBalanceSeeder extends Seeder
{
    public function run(): void
    {
        $investments = Investment::withTrashed()->get();

        if ($investments->isEmpty()) {
            $this->command->info('No investments found — skipping capital balance seed.');
            return;
        }

        $this->command->info("Seeding capital balances for {$investments->count()} investment(s)...");

        foreach ($investments as $investment) {
            // Skip if already seeded (safe to re-run)
            if (InvestorCapitalBalance::where('investment_id', $investment->id)->exists()) {
                $this->command->warn("  → Skipping [{$investment->investor_name}] — balance already exists.");
                continue;
            }

            DB::transaction(function () use ($investment) {
                $amount = (float) $investment->amount;

                // 1. Create balance record
                $balance = InvestorCapitalBalance::create([
                    'investment_id'    => $investment->id,
                    'investor_name'    => $investment->investor_name,
                    'total_deposited'  => $amount,
                    'total_withdrawn'  => 0,
                    'total_reinvested' => 0,
                    'total_adjusted'   => 0,
                    'current_balance'  => $amount,
                ]);

                // 2. Create initial ledger entry (inside transaction for safe reference_no)
                $referenceNo = CapitalLedgerEntry::generateReferenceNo();

                CapitalLedgerEntry::create([
                    'investment_id'    => $investment->id,
                    'investor_name'    => $investment->investor_name,
                    'transaction_type' => 'deposit',
                    'direction'        => 'credit',
                    'amount'           => $amount,
                    'running_balance'  => $amount,
                    'reference_no'     => $referenceNo,
                    'source_type'      => null,
                    'source_id'        => null,
                    'reason'           => 'Initial capital deposit (seeded from investment record)',
                    'note'             => "Investment date: {$investment->investment_date}",
                    'status'           => 'completed',
                    'requested_by'     => null,
                    'created_by'       => $investment->created_by,
                ]);
            });

            $this->command->info("  ✓ Seeded [{$investment->investor_name}] → ৳ {$investment->amount}");
        }

        $this->command->info('Capital balance seeding complete.');
    }
}
