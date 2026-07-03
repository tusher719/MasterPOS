<?php
// app/Policies/ProductCategoryPolicy.php

namespace App\Policies;

use App\Models\User;
use App\Models\ProductCategory;

class ProductCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('product_category.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('product_category.create');
    }

    public function update(User $user, ProductCategory $category): bool
    {
        return $user->hasPermissionTo('product_category.edit');
    }

    public function delete(User $user, ProductCategory $category): bool
    {
        return $user->hasPermissionTo('product_category.delete');
    }
}
