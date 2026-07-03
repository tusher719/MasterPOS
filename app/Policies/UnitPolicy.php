<?php
// app/Policies/UnitPolicy.php

namespace App\Policies;

use App\Models\User;
use App\Models\Unit;

class UnitPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('unit.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('unit.create');
    }

    public function update(User $user, Unit $unit): bool
    {
        return $user->hasPermissionTo('unit.edit');
    }

    public function delete(User $user, Unit $unit): bool
    {
        return $user->hasPermissionTo('unit.delete');
    }
}
