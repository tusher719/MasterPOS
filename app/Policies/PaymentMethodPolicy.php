<?php

namespace App\Policies;

use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PaymentMethodPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('payment_method.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('payment_method.create');
    }

    public function update(User $user, PaymentMethod $paymentMethod): bool
    {
        return $user->hasPermissionTo('payment_method.edit');
    }

    public function delete(User $user, PaymentMethod $paymentMethod): bool
    {
        return $user->hasPermissionTo('payment_method.delete');
    }
}
