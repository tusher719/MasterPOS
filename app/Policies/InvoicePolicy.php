<?php

namespace App\Policies;

use App\Models\User;

class InvoicePolicy
{
    /**
     * Any authenticated user with invoice.view permission can view invoice list.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('invoice.view');
    }

    /**
     * Print / download PDF — requires invoice.print permission.
     */
    public function print(User $user): bool
    {
        return $user->hasPermissionTo('invoice.print');
    }
}
