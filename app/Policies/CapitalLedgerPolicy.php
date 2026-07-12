<?php

// app/Policies/CapitalLedgerPolicy.php

namespace App\Policies;

use App\Models\CapitalLedgerEntry;
use App\Models\User;

class CapitalLedgerPolicy
{
    // View capital ledger index + show
    public function view(User $user): bool
    {
        return $user->hasPermissionTo('capital_ledger.view');
    }

    // Create deposit entry
    public function deposit(User $user): bool
    {
        return $user->hasPermissionTo('capital_ledger.deposit');
    }

    // Create adjustment entry
    public function adjust(User $user): bool
    {
        return $user->hasPermissionTo('capital_ledger.adjust');
    }

    // Request a withdrawal
    public function requestWithdrawal(User $user): bool
    {
        return $user->hasPermissionTo('capital_ledger.withdrawal.request');
    }

    // Approve or reject a withdrawal
    public function approveWithdrawal(User $user): bool
    {
        return $user->hasPermissionTo('capital_ledger.withdrawal.approve');
    }

    // Cancel own pending withdrawal request
    public function cancelWithdrawal(User $user, CapitalLedgerEntry $entry): bool
    {
        return $user->hasPermissionTo('capital_ledger.withdrawal.request')
            && $entry->isPending();
    }
}
