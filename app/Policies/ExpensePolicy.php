<?php

namespace App\Policies;

use App\Models\User;

class ExpensePolicy
{
    public function view(User $user): bool
    {
        return $user->hasPermissionTo('expense.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('expense.create');
    }

    public function edit(User $user): bool
    {
        return $user->hasPermissionTo('expense.edit');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('expense.delete');
    }

    public function restore(User $user): bool
    {
        return $user->hasPermissionTo('expense.restore');
    }
}
