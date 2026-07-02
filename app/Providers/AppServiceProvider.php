<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use App\Listeners\RecordLoginHistory;
use App\Models\BusinessSetting;
use App\Models\ExpenseCategory;
use App\Models\InvestmentType;
use App\Models\PaymentMethod;
use App\Models\User;
use App\Policies\ExpenseCategoryPolicy;
use App\Policies\InvestmentTypePolicy;
use App\Policies\SettingPolicy;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // ─── Event Listeners ──────────────────────────────────────────────────
        Event::listen(
            Login::class,
            RecordLoginHistory::class,
        );

        // ─── Step 02 Policies ─────────────────────────────────────────────────
        Gate::policy(
            User::class,
            \App\Policies\UserPolicy::class
        );
        Gate::policy(
            Role::class,
            \App\Policies\RolePolicy::class
        );

        // ─── Step 03 Policies ─────────────────────────────────────────────────
        Gate::policy(
            BusinessSetting::class,
            SettingPolicy::class
        );
        Gate::policy(
            PaymentMethod::class,
            PaymentMethod::class
        );
        Gate::policy(
            ExpenseCategory::class,
            ExpenseCategoryPolicy::class
        );
        Gate::policy(
            InvestmentType::class,
            InvestmentTypePolicy::class
        );
    }
}
