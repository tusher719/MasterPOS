<?php

namespace App\Policies;

use App\Models\ProfitDistributionEligibility;
use App\Models\User;

class ProfitDistributionEligibilityPolicy
{
    /**
     * Only admin can override eligibility decisions.
     */
    public function override(User $user): bool
    {
        return $user->hasPermissionTo('profit_distribution.eligibility');
    }

    /**
     * Viewing eligibility records is tied to general distribution view permission.
     */
    public function view(User $user): bool
    {
        return $user->hasPermissionTo('profit_distribution.view');
    }
}
