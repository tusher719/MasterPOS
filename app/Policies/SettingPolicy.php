<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SettingPolicy
{
    use HandlesAuthorization;

    public function view(User $user): bool
    {
        return $user->hasPermissionTo('settings.view');
    }

    public function edit(User $user): bool
    {
        return $user->hasPermissionTo('settings.edit');
    }
}
