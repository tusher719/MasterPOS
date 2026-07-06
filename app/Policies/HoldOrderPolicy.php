<?php

namespace App\Policies;

use App\Models\User;

class HoldOrderPolicy
{
    public function view(User $user): bool
    {
        return $user->hasPermissionTo('hold_order.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('hold_order.create');
    }

    public function edit(User $user): bool
    {
        return $user->hasPermissionTo('hold_order.edit');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('hold_order.delete');
    }
}
