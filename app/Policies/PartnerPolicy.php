<?php

namespace App\Policies;

use App\Models\Partner;
use App\Models\User;

class PartnerPolicy
{
    // Super Admin bypassed via Gate::before() in AppServiceProvider

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('partners.view');
    }

    public function view(User $user, Partner $partner): bool
    {
        return $user->hasPermissionTo('partners.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('partners.create');
    }

    public function update(User $user, Partner $partner): bool
    {
        return $user->hasPermissionTo('partners.edit');
    }

    public function delete(User $user, Partner $partner): bool
    {
        return $user->hasPermissionTo('partners.delete');
    }

    public function restore(User $user): bool
    {
        return $user->hasPermissionTo('partners.restore');
    }

    public function forceDelete(User $user, Partner $partner): bool
    {
        return $user->hasRole('Super Admin');
    }
}
