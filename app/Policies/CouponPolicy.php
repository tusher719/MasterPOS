<?php

namespace App\Policies;

use App\Models\Coupon;
use App\Models\User;

class CouponPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('Admin') || $user->hasPermissionTo('coupons.view');
    }

    public function view(User $user, Coupon $coupon): bool
    {
        return $user->hasRole('Admin') || $user->hasPermissionTo('coupons.view');
    }

    public function create(User $user): bool
    {
        return $user->hasRole('Admin') || $user->hasPermissionTo('coupons.create');
    }

    public function update(User $user, Coupon $coupon): bool
    {
        return $user->hasRole('Admin') || $user->hasPermissionTo('coupons.edit');
    }

    public function delete(User $user, Coupon $coupon): bool
    {
        return $user->hasRole('Admin') || $user->hasPermissionTo('coupons.delete');
    }

    public function restore(User $user, Coupon $coupon): bool
    {
        return $user->hasRole('Admin') || $user->hasPermissionTo('coupons.restore');
    }
}
