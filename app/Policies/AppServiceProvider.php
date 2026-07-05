<?php
// app/Providers/AppServiceProvider.php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

// Step 02 models & policies
use App\Models\User;
use App\Role;
use App\Policies\UserPolicy;
use App\Policies\RolePolicy;

// Step 03 models & policies
use App\Models\BusinessSetting;
use App\Models\PaymentMethod;
use App\Models\ExpenseCategory;
use App\Models\InvestmentType;
use App\Policies\SettingPolicy;
use App\Policies\PaymentMethodPolicy;
use App\Policies\ExpenseCategoryPolicy;
use App\Policies\InvestmentTypePolicy;

// Step 04 models & policies
use App\Models\ProductCategory;
use App\Models\Unit;
use App\Models\Product;
use App\Policies\ProductCategoryPolicy;
use App\Policies\UnitPolicy;
use App\Policies\ProductPolicy;

// Events & Listeners
use Illuminate\Auth\Events\Login;
use App\Listeners\RecordLoginHistory;
use App\Models\Customer;
use App\Policies\CustomerPolicy;
use Illuminate\Support\Facades\Event;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // --- Policies ---
        Gate::policy(User::class,            UserPolicy::class);
        // Gate::policy(Role::class,            RolePolicy::class);
        Gate::policy(BusinessSetting::class, SettingPolicy::class);
        Gate::policy(PaymentMethod::class,   PaymentMethodPolicy::class);
        Gate::policy(ExpenseCategory::class, ExpenseCategoryPolicy::class);
        Gate::policy(InvestmentType::class,  InvestmentTypePolicy::class);

        // Step 04
        Gate::policy(ProductCategory::class, ProductCategoryPolicy::class);
        Gate::policy(Unit::class,            UnitPolicy::class);
        Gate::policy(Product::class,         ProductPolicy::class);

        // --- Event Listeners ---
        Event::listen(Login::class, RecordLoginHistory::class);

        Gate::policy(Customer::class, CustomerPolicy::class);
    }
}
