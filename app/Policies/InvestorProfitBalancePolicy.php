<?php

namespace App\Policies;

use App\Models\InvestorProfitBalance;
use App\Models\User;

class InvestorProfitBalancePolicy
{
    public function view(User $user): bool
    {
        return $user->hasPermissionTo('investor_balance.view');
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('investor_balance.view');
    }
}
