<?php

namespace App\Policies;

use App\Models\User;

class PartnerProfitRulePolicy
{
    // No model parameter on methods that only check permission
    // (Adding model param causes ArgumentCountError when called with class string)

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('profit_rule.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('profit_rule.create');
    }

    public function edit(User $user): bool
    {
        return $user->hasPermissionTo('profit_rule.edit');
    }

    /**
     * Approve is separate from edit — requires higher permission (Super Admin only).
     */
    public function approve(User $user): bool
    {
        return $user->hasPermissionTo('profit_rule.approve');
    }
}
