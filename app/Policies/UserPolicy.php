<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('users.view');
    }

    public function create(User $user): bool
    {
        return $user->can('users.create');
    }

    public function update(User $user): bool
    {
        return $user->can('users.edit');
    }

    public function delete(User $user): bool
    {
        return $user->can('users.delete');
    }

    public function restore(User $user): bool
    {
        return $user->can('users.restore');
    }
}
