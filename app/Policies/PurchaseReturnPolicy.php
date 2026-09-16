<?php

namespace App\Policies;

use App\Models\User;

class PurchaseReturnPolicy
{
    // No model parameter on any method — Rule 3 pattern
    // (Adding model param causes ArgumentCountError when called with class string)

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('purchase_return.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('purchase_return.create');
    }

    public function confirm(User $user): bool
    {
        return $user->hasPermissionTo('purchase_return.confirm');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('purchase_return.delete');
    }

    public function restore(User $user): bool
    {
        // Reuses delete permission — no separate restore permission needed
        return $user->hasPermissionTo('purchase_return.delete');
    }
}
