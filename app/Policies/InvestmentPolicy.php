<?php

namespace App\Policies;

use App\Models\User;

class InvestmentPolicy
{
    public function view(User $user): bool
    {
        return $user->hasPermissionTo('investment.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('investment.create');
    }

    public function edit(User $user): bool
    {
        return $user->hasPermissionTo('investment.edit');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('investment.delete');
    }

    public function restore(User $user): bool
    {
        return $user->hasPermissionTo('investment.restore');
    }
}
