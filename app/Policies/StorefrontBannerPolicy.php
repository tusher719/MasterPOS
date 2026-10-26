<?php

namespace App\Policies;

use App\Models\StorefrontBanner;
use App\Models\User;

class StorefrontBannerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('Admin') || $user->hasPermissionTo('banners.view');
    }

    public function view(User $user, ?StorefrontBanner $banner = null): bool
    {
        return $user->hasRole('Admin') || $user->hasPermissionTo('banners.view');
    }

    public function create(User $user): bool
    {
        return $user->hasRole('Admin') || $user->hasPermissionTo('banners.create');
    }

    public function update(User $user, ?StorefrontBanner $banner = null): bool
    {
        return $user->hasRole('Admin') || $user->hasPermissionTo('banners.edit');
    }

    public function delete(User $user, ?StorefrontBanner $banner = null): bool
    {
        return $user->hasRole('Admin') || $user->hasPermissionTo('banners.delete');
    }

    public function restore(User $user, ?StorefrontBanner $banner = null): bool
    {
        return $user->hasRole('Admin') || $user->hasPermissionTo('banners.restore');
    }
}
