<?php

namespace App\Policies;

use App\Models\User;

class PartnerSettlementConfigPolicy
{
    // No model parameter on any method — prevents ArgumentCountError
    // when called with class-string via Gate::allows() (Phase 4B/4C pattern)

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('settlement_config.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('settlement_config.create');
    }

    public function edit(User $user): bool
    {
        return $user->hasPermissionTo('settlement_config.edit');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('settlement_config.delete');
    }
}
