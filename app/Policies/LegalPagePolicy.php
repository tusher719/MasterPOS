<?php

namespace App\Policies;

use App\Models\User;

class LegalPagePolicy
{
    // No model parameter — consistent with Rule 3 pattern
    // (avoids ArgumentCountError when called with class string)

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('legal_page.view');
    }

    public function edit(User $user): bool
    {
        return $user->hasPermissionTo('legal_page.edit');
    }
}
