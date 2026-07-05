<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

class CustomerPolicy
{
    public function before(User $user, string $ability): bool|null
    {
        return null;
    }

    public function view(User $user): bool
    {
        return $user->hasPermissionTo('customer.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('customer.create');
    }

    public function edit(User $user): bool
    {
        return $user->hasPermissionTo('customer.edit');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('customer.delete');
    }

    public function restore(User $user): bool
    {
        return $user->hasPermissionTo('customer.restore');
    }
}
