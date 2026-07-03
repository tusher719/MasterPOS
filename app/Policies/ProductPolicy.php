<?php
// app/Policies/ProductPolicy.php

namespace App\Policies;

use App\Models\User;
use App\Models\Product;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('product.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('product.create');
    }

    public function update(User $user, Product $product): bool
    {
        return $user->hasPermissionTo('product.edit');
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->hasPermissionTo('product.delete');
    }
}
