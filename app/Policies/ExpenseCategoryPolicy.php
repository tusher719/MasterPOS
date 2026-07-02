<?php

namespace App\Policies;

use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ExpenseCategoryPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('expense_category.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('expense_category.create');
    }

    public function update(User $user, ExpenseCategory $expenseCategory): bool
    {
        return $user->hasPermissionTo('expense_category.edit');
    }

    public function delete(User $user, ExpenseCategory $expenseCategory): bool
    {
        return $user->hasPermissionTo('expense_category.delete');
    }
}
