<?php

namespace App\Policies;

use App\Models\User;

class OrderTaskPolicy
{
    // No model parameter on any method — prevents ArgumentCountError
    // when called with class string via Gate::allows() (Rule 3 pattern)

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('order_task.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('order_task.create');
    }

    public function assign(User $user): bool
    {
        return $user->hasPermissionTo('order_task.assign');
    }

    public function claim(User $user): bool
    {
        return $user->hasPermissionTo('order_task.claim');
    }

    public function complete(User $user): bool
    {
        return $user->hasPermissionTo('order_task.complete');
    }

    public function delete(User $user): bool
    {
        // Reuses create permission — no separate delete permission needed
        return $user->hasPermissionTo('order_task.create');
    }
}
