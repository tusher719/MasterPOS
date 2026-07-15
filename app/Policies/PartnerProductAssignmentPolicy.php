<?php

namespace App\Policies;

use App\Models\User;

class PartnerProductAssignmentPolicy
{
    /**
     * No model parameter on any method — consistent with Phase 4B/4C/4D pattern.
     * Adding model param causes ArgumentCountError when called with class string.
     */

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('product_assignment.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('product_assignment.create');
    }

    public function edit(User $user): bool
    {
        return $user->hasPermissionTo('product_assignment.edit');
    }

    public function approve(User $user): bool
    {
        return $user->hasPermissionTo('product_assignment.approve');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('product_assignment.edit');
    }
}
