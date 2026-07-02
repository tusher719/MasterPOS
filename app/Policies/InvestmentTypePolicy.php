<?php

namespace App\Policies;

use App\Models\InvestmentType;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class InvestmentTypePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('investment_type.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('investment_type.create');
    }

    public function update(User $user, InvestmentType $investmentType): bool
    {
        return $user->hasPermissionTo('investment_type.edit');
    }

    public function delete(User $user, InvestmentType $investmentType): bool
    {
        return $user->hasPermissionTo('investment_type.delete');
    }
}
