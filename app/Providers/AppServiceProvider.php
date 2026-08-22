<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use App\Listeners\RecordLoginHistory;
use App\Models\BusinessSetting;
use App\Models\CapitalLedgerEntry;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FraudFlag;
use App\Models\HoldOrder;
use App\Models\Investment;
use App\Models\InvestmentFundUsage;
use App\Models\InvestmentType;
use App\Models\InvestorProfitBalance;
use App\Models\OrderTask;
use App\Models\Partner;
use App\Models\PartnerProductAssignment;
use App\Models\PartnerProfitEligibility;
use App\Models\PartnerProfitRule;
use App\Models\PartnerSettlementConfig;
use App\Models\PaymentMethod;
use App\Models\PreOrder;
use App\Models\ProfitDistribution;
use App\Models\ProfitDistributionEligibility;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\User;
use App\Observers\BusinessSettingObserver;
use App\Policies\CapitalLedgerPolicy;
use App\Policies\ExpenseCategoryPolicy;
use App\Policies\ExpensePolicy;
use App\Policies\FraudFlagPolicy;
use App\Policies\HoldOrderPolicy;
use App\Policies\InvestmentFundUsagePolicy;
use App\Policies\InvestmentPolicy;
use App\Policies\InvestmentTypePolicy;
use App\Policies\InvestorProfitBalancePolicy;
use App\Policies\InvoicePolicy;
use App\Policies\NotificationPolicy;
use App\Policies\OrderTaskPolicy;
use App\Policies\PartnerEligibilityPolicy;
use App\Policies\PartnerPolicy;
use App\Policies\PartnerProductAssignmentPolicy;
use App\Policies\PartnerProfitRulePolicy;
use App\Policies\PartnerSettlementConfigPolicy;
use App\Policies\PaymentMethodPolicy;
use App\Policies\PreOrderPolicy;
use App\Policies\ProfitDistributionEligibilityPolicy;
use App\Policies\ProfitDistributionPolicy;
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

        // ─── Step 13 Policies ─────────────────────────────────────────────────
        Gate::policy(ProfitDistribution::class, ProfitDistributionPolicy::class);

        Gate::policy(ProfitDistributionEligibility::class, ProfitDistributionEligibilityPolicy::class);
        Gate::policy(InvestorProfitBalance::class, InvestorProfitBalancePolicy::class);

        // ─── Step 17 Policies ─────────────────────────────────────────────────
        Gate::policy(CapitalLedgerEntry::class, CapitalLedgerPolicy::class);

        // ─── Step 17 Phase 4A Policies ─────────────────────────────────────────────────
        Gate::policy(Partner::class, PartnerPolicy::class);

        // ─── Step 17 Phase 4B Policies ─────────────────────────────────────────────────
        Gate::policy(PartnerProfitRule::class, PartnerProfitRulePolicy::class);

        // ─── Step 17 Phase 4C Policies ─────────────────────────────────────────────────
        Gate::policy(PartnerProfitEligibility::class, PartnerEligibilityPolicy::class);

        // ─── Step 17 Phase 4D Policies ─────────────────────────────────────────────────
        Gate::policy(PartnerSettlementConfig::class, PartnerSettlementConfigPolicy::class);

        // ─── Step 17 Phase 4E Policies ─────────────────────────────────────────────────
        Gate::policy(PartnerProductAssignment::class, PartnerProductAssignmentPolicy::class);

        // ─── Step 17 Phase 4G Policies ─────────────────────────────────────────────────
        Gate::policy(InvestmentFundUsage::class, InvestmentFundUsagePolicy::class);

        // ─── Sprint 3 — Fraud Protection ──────────────────────────────────────
        Gate::policy(FraudFlag::class, FraudFlagPolicy::class);

        // Settings cache invalidation
        BusinessSetting::observe(BusinessSettingObserver::class);

        // Sprint 4 — Order Tasks
        Gate::policy(OrderTask::class, OrderTaskPolicy::class);

        // ─── Sprint 4 — Pre-Orders ────────────────────────────────────────────────
        Gate::policy(PreOrder::class, PreOrderPolicy::class);
    }
}
