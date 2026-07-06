<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use App\Listeners\RecordLoginHistory;
use App\Models\BusinessSetting;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\HoldOrder;
use App\Models\Investment;
use App\Models\InvestmentType;
use App\Models\PaymentMethod;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\User;
use App\Policies\ExpenseCategoryPolicy;
use App\Policies\ExpensePolicy;
use App\Policies\HoldOrderPolicy;
use App\Policies\InvestmentPolicy;
use App\Policies\InvestmentTypePolicy;
use App\Policies\InvoicePolicy;
use App\Policies\NotificationPolicy;
use App\Policies\PaymentMethodPolicy;
use App\Policies\PurchasePolicy;
use App\Policies\SalePolicy;
use App\Policies\SettingPolicy;
use App\Policies\SupplierPolicy;
use Illuminate\Notifications\DatabaseNotification;
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
        Gate::policy(User::class, \App\Policies\UserPolicy::class);
        Gate::policy(Role::class, \App\Policies\RolePolicy::class);

        // ─── Step 03 Policies ─────────────────────────────────────────────────
        Gate::policy(BusinessSetting::class,  SettingPolicy::class);
        Gate::policy(PaymentMethod::class,    PaymentMethodPolicy::class);
        Gate::policy(ExpenseCategory::class,  ExpenseCategoryPolicy::class);
        Gate::policy(InvestmentType::class,   InvestmentTypePolicy::class);

        // ─── Step 05 Policies ─────────────────────────────────────────────────
        Gate::policy(DatabaseNotification::class, NotificationPolicy::class);

        // ─── Step 06 Policies ─────────────────────────────────────────────────
        Gate::policy(Supplier::class, SupplierPolicy::class);

        // ─── Step 07 Policies ─────────────────────────────────────────────────
        Gate::policy(Purchase::class, PurchasePolicy::class);

        // ─── Step 08 Policies ─────────────────────────────────────────────────
        Gate::policy(Sale::class, SalePolicy::class);

        // ─── Step 10 Policies ─────────────────────────────────────────────────
        Gate::policy(Sale::class . '@invoice', InvoicePolicy::class);

        // ─── Step 11 Policies ─────────────────────────────────────────────────
        Gate::policy(HoldOrder::class, HoldOrderPolicy::class);

        // ─── Step 12 Policies ─────────────────────────────────────────────────
        Gate::policy(Expense::class, ExpensePolicy::class);

        // ─── Step 13 Policies ─────────────────────────────────────────────────
        Gate::policy(Investment::class, InvestmentPolicy::class);
    }
}
