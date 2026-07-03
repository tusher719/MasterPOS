<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Supplier;

class SupplierPolicy
{
    public function view(User $user): bool
    {
        return $user->hasPermissionTo('supplier.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('supplier.create');
    }

    public function update(User $user, Supplier $supplier): bool
    {
        return $user->hasPermissionTo('supplier.edit');
    }

    public function delete(User $user, Supplier $supplier): bool
    {
        return $user->hasPermissionTo('supplier.delete');
    }

    public function restore(User $user, Supplier $supplier): bool
    {
        return $user->hasPermissionTo('supplier.restore');
    }
}
