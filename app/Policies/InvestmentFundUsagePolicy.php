<?php

namespace App\Policies;

use App\Models\User;

class InvestmentFundUsagePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('fund_usage.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('fund_usage.create');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('fund_usage.delete');
    }
}
