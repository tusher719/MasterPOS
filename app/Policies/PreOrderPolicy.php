<?php

namespace App\Policies;

use App\Models\User;

class PreOrderPolicy
{
    // ─── No model parameter on any method (Rule 3) ────────────────────────────
    // Adding model param causes ArgumentCountError when called with class string

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('pre_order.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('pre_order.create');
    }

    /** manage = edit + status change + convert to sale */
    public function manage(User $user): bool
    {
        return $user->hasPermissionTo('pre_order.manage');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('pre_order.manage');
    }

    public function restore(User $user): bool
    {
        return $user->hasPermissionTo('pre_order.manage');
    }
}
