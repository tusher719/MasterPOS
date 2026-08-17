<?php

namespace App\Policies;

use App\Models\User;

class FraudFlagPolicy
{
    // No model parameter on any method — prevents ArgumentCountError
    // when called with class-string via Gate::allows() (Rule 3 pattern)

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('fraud.flag') ||
               $user->hasPermissionTo('fraud.review');
    }

    public function flag(User $user): bool
    {
        return $user->hasPermissionTo('fraud.flag');
    }

    public function review(User $user): bool
    {
        return $user->hasPermissionTo('fraud.review');
    }
}
