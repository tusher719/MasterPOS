<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ProductPlanningTaskPolicy
{
    use HandlesAuthorization;

    // No model parameter on any method — prevents ArgumentCountError
    // when called with class string via Gate::allows() (Rule 3 pattern)

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('product_task.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('product_task.create');
    }

    public function edit(User $user): bool
    {
        return $user->hasPermissionTo('product_task.edit');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('product_task.delete');
    }

    public function restore(User $user): bool
    {
        return $user->hasPermissionTo('product_task.delete');
    }
}
