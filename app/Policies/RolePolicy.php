<?php

namespace App\Policies;

use App\Models\User;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('roles.view');
    }

    public function create(User $user): bool
    {
        return $user->can('roles.create');
    }

    public function edit(User $user): bool
    {
        return $user->can('roles.edit');
    }

    public function delete(User $user): bool
    {
        return $user->can('roles.delete');
    }
}
