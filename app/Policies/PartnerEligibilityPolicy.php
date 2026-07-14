<?php

namespace App\Policies;

use App\Models\User;

class PartnerEligibilityPolicy
{
    /**
     * NOTE: No model parameter on any method.
     * Adding a model param causes ArgumentCountError when called
     * with a class string via Gate::allows() — consistent with
     * PartnerPolicy and PartnerProfitRulePolicy patterns.
     */

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('eligibility.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('eligibility.create');
    }

    public function pause(User $user): bool
    {
        return $user->hasPermissionTo('eligibility.pause');
    }

    public function resume(User $user): bool
    {
        return $user->hasPermissionTo('eligibility.resume');
    }

    /**
     * End uses the pause permission — ending eligibility is
     * the same authority level as pausing it.
     */
    public function end(User $user): bool
    {
        return $user->hasPermissionTo('eligibility.pause');
    }
}
