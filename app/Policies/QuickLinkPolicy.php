<?php

namespace App\Policies;

use App\Models\User;

class QuickLinkPolicy
{
    // No model parameter on any method — Rule 3 pattern.
    // Adding model param causes ArgumentCountError when called with class string.

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('quick_link.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('quick_link.create');
    }

    public function edit(User $user): bool
    {
        return $user->hasPermissionTo('quick_link.edit');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('quick_link.edit'); // reuse edit permission
    }
}
