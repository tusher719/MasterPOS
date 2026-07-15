<?php

use App\Http\Controllers\Backend\ActivityLogController;
use App\Http\Controllers\Backend\CapitalLedgerController;
use App\Http\Controllers\Backend\CapitalWithdrawalController;
use App\Http\Controllers\Backend\CustomerController;
use App\Http\Controllers\Backend\DashboardController;
use App\Http\Controllers\Backend\DistributionReverseController;
use App\Http\Controllers\Backend\LoginHistoryController;
use App\Http\Controllers\Backend\RoleController;
use App\Http\Controllers\Backend\UserController;
use App\Http\Controllers\Backend\SettingController;
use App\Http\Controllers\Backend\PaymentMethodController;
use App\Http\Controllers\Backend\ExpenseCategoryController;
use App\Http\Controllers\Backend\ExpenseController;
use App\Http\Controllers\Backend\HoldOrderController;
use App\Http\Controllers\Backend\InvestmentController;
use App\Http\Controllers\Backend\InvestmentTypeController;
use App\Http\Controllers\Backend\InvestorBalanceController;
use App\Http\Controllers\Backend\InvestorStatementController;
use App\Http\Controllers\Backend\InvoiceController;
use App\Http\Controllers\Backend\NotificationController;
use App\Http\Controllers\Backend\PartnerController;
use App\Http\Controllers\Backend\PartnerEligibilityController;
use App\Http\Controllers\Backend\PartnerProfitRuleController;
use App\Http\Controllers\Backend\PartnerSettlementConfigController;
use App\Http\Controllers\Backend\ProductCategoryController;
use App\Http\Controllers\Backend\ProductController;
use App\Http\Controllers\Backend\ProfitDistributionController;
use App\Http\Controllers\Backend\ProfitPaymentController;
use App\Http\Controllers\Backend\PurchaseController;
use App\Http\Controllers\Backend\PurchasePaymentController;
use App\Http\Controllers\Backend\ReportController;
use App\Http\Controllers\Backend\SaleController;
use App\Http\Controllers\Backend\SupplierController;
use App\Http\Controllers\Backend\UnitController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified'])
    ->prefix('backend')
    ->name('backend.')
    ->group(function () {
        Route::resource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);

        // Role Method
        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
        Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
        Route::put('roles/{role}/permissions', [RoleController::class, 'updatePermissions'])->name('roles.permissions');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

        Route::get('login-histories', [LoginHistoryController::class, 'index'])->name('login-histories.index');
        Route::get('activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');

        // Business Settings
        Route::prefix('settings')->name('settings.')->group(function () {
            Route::get('/', [SettingController::class, 'index'])->name('index');
            Route::post('/', [SettingController::class, 'update'])->name('update');
            Route::post('/logo', [SettingController::class, 'uploadLogo'])
                ->middleware('throttle:10,1')
                ->name('logo');
        });

        // Payment Methods
        Route::prefix('payment-methods')->name('payment-methods.')->group(function () {
            Route::get('/', [PaymentMethodController::class, 'index'])->name('index');
            Route::post('/', [PaymentMethodController::class, 'store'])->name('store');
            Route::put('/{paymentMethod}', [PaymentMethodController::class, 'update'])->name('update');
            Route::delete('/{paymentMethod}', [PaymentMethodController::class, 'destroy'])->name('destroy');
        });

        // Expense Categories
        Route::prefix('expense-categories')->name('expense-categories.')->group(function () {
            Route::get('/', [ExpenseCategoryController::class, 'index'])->name('index');
            Route::post('/', [ExpenseCategoryController::class, 'store'])->name('store');
            Route::put('/{expenseCategory}', [ExpenseCategoryController::class, 'update'])->name('update');
            Route::delete('/{expenseCategory}', [ExpenseCategoryController::class, 'destroy'])->name('destroy');
        });

        // Investment Types
        Route::prefix('investment-types')->name('investment-types.')->group(function () {
            Route::get('/', [InvestmentTypeController::class, 'index'])->name('index');
            Route::post('/', [InvestmentTypeController::class, 'store'])->name('store');
            Route::put('/{investmentType}', [InvestmentTypeController::class, 'update'])->name('update');
            Route::delete('/{investmentType}', [InvestmentTypeController::class, 'destroy'])->name('destroy');
        });

         // --- Product Categories ---
        Route::get('/product-categories', [ProductCategoryController::class, 'index'])
            ->name('product-categories.index');
        Route::post('/product-categories', [ProductCategoryController::class, 'store'])
            ->name('product-categories.store');
        Route::put('/product-categories/{productCategory}', [ProductCategoryController::class, 'update'])
            ->name('product-categories.update');
        Route::delete('/product-categories/{productCategory}', [ProductCategoryController::class, 'destroy'])
            ->name('product-categories.destroy');

        // --- Units ---
        Route::get('/units', [UnitController::class, 'index'])
            ->name('units.index');
        Route::post('/units', [UnitController::class, 'store'])
            ->name('units.store');
        Route::put('/units/{unit}', [UnitController::class, 'update'])
            ->name('units.update');
        Route::delete('/units/{unit}', [UnitController::class, 'destroy'])
            ->name('units.destroy');

        // --- Products ---
        Route::get('/products', [ProductController::class, 'index'])
            ->name('products.index');
        Route::get('/products/create', [ProductController::class, 'create'])
            ->name('products.create');
        Route::post('/products', [ProductController::class, 'store'])
            ->name('products.store');
        Route::get('/products/{product}/edit', [ProductController::class, 'edit'])
            ->name('products.edit');
        Route::put('/products/{product}', [ProductController::class, 'update'])
            ->name('products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])
            ->name('products.destroy');

        // --- Product Images ---
        Route::delete('/products/{product}/images/{image}', [ProductController::class, 'destroyImage'])
            ->name('products.images.destroy');
        Route::post('/products/{product}/images/{image}/primary', [ProductController::class, 'setPrimaryImage'])
            ->name('products.images.primary');

            // ── Step 05: Notifications

        Route::get('/notifications', [NotificationController::class, 'index'])
            ->name('notifications.index');

        Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])
            ->name('notifications.read');

        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])
            ->name('notifications.read-all');

        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])
            ->name('notifications.destroy');

        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])
            ->name('notifications.unread-count');

            // Step 06 — Supplier Management
        Route::prefix('suppliers')->name('suppliers.')->group(function () {
            Route::get('/', [SupplierController::class, 'index'])->name('index');
            Route::post('/', [SupplierController::class, 'store'])->name('store');
            Route::put('/{supplier}', [SupplierController::class, 'update'])->name('update');
            Route::delete('/{supplier}', [SupplierController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/restore', [SupplierController::class, 'restore'])->name('restore');
        });

        // ── Purchases ─────────────────────────────────────────────────────────────

        // Bulk action — must be before {purchase} to avoid route conflict
        Route::post('purchases/bulk-action', [PurchaseController::class, 'bulkAction'])
            ->name('purchases.bulk-action');

        // Restore — uses plain id, not route model binding (soft deleted records)
        Route::post('purchases/{id}/restore', [PurchaseController::class, 'restore'])
            ->name('purchases.restore');

        // Duplicate
        Route::post('purchases/{purchase}/duplicate', [PurchaseController::class, 'duplicate'])
            ->name('purchases.duplicate');

        // Standard resource routes
        Route::get('purchases',                 [PurchaseController::class, 'index'])
            ->name('purchases.index');

        Route::get('purchases/create',          [PurchaseController::class, 'create'])
            ->name('purchases.create');

        Route::post('purchases',                [PurchaseController::class, 'store'])
            ->name('purchases.store');

        Route::get('purchases/{purchase}',      [PurchaseController::class, 'show'])
            ->name('purchases.show');

        Route::get('purchases/{purchase}/edit', [PurchaseController::class, 'edit'])
            ->name('purchases.edit');

        Route::put('purchases/{purchase}',      [PurchaseController::class, 'update'])
            ->name('purchases.update');

        Route::delete('purchases/{purchase}',   [PurchaseController::class, 'destroy'])
            ->name('purchases.destroy');

        // ── Purchase Payments ─────────────────────────────────────────────────────

        Route::get('purchases/{purchase}/payments',
            [PurchasePaymentController::class, 'index'])
            ->name('purchases.payments.index');

        Route::post('purchases/{purchase}/payments',
            [PurchasePaymentController::class, 'store'])
            ->name('purchases.payments.store');

        Route::delete('purchases/{purchase}/payments/{payment}',
            [PurchasePaymentController::class, 'destroy'])
            ->name('purchases.payments.destroy');

        // Customers
        Route::post('customers/{id}/restore', [CustomerController::class, 'restore'])->name('customers.restore');
        Route::resource('customers', CustomerController::class)->except(['create', 'show', 'edit'])->parameters(['customers' => 'customer']);

            // ── Step 09: POS (Cart/Sale) ──────────────────────────────────────
        Route::prefix('pos')->group(function () {

            // POS Terminal
            Route::get('/', [SaleController::class, 'index'])
                ->name('pos.index');

            // Sales CRUD
            Route::post('/sales', [SaleController::class, 'store'])
                    ->middleware('throttle:30,1')
                    ->name('pos.sales.store');

            Route::post('/sales/{id}/restore', [SaleController::class, 'restore'])
                ->name('pos.sales.restore');

            Route::get('/sales', [SaleController::class, 'salesList'])
                ->name('pos.sales.index');

            Route::get('/sales/{sale}', [SaleController::class, 'show'])
                ->name('pos.sales.show');

            Route::delete('/sales/{sale}', [SaleController::class, 'destroy'])
                ->name('pos.sales.destroy');
        });

        // ─── Step 10: Invoices ────────────────────────────────────────────────────
        Route::prefix('invoices')->name('invoices.')->group(function () {
            Route::get('/', [InvoiceController::class, 'index'])->name('index');
            Route::get('/{sale}', [InvoiceController::class, 'show'])->name('show');
            Route::get('/{sale}/pdf', [InvoiceController::class, 'pdf'])
                ->middleware('throttle:30,1')
                ->name('pdf');
        });

        // ─── Hold Orders ──────────────────────────────────────────────────
        Route::prefix('pos/hold-orders')->name('pos.hold-orders.')->group(function () {
            Route::get('/', [HoldOrderController::class, 'index'])->name('index');
            Route::post('/', [HoldOrderController::class, 'store'])->name('store');
            Route::put('/{id}', [HoldOrderController::class, 'update'])->name('update');
            Route::delete('/{id}', [HoldOrderController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/resume', [HoldOrderController::class, 'resume'])->name('resume');
            Route::post('/{id}/release', [HoldOrderController::class, 'release'])->name('release');
        });

        // -----------------------------------------------------------------------
        // Expenses
        // -----------------------------------------------------------------------
        Route::prefix('expenses')->name('expenses.')->group(function () {
            Route::post('bulk-action', [ExpenseController::class, 'bulkAction'])
                ->name('bulk-action');
            Route::post('{id}/restore', [ExpenseController::class, 'restore'])
                ->name('restore');
            Route::get('/', [ExpenseController::class, 'index'])
                ->name('index');
            Route::post('/', [ExpenseController::class, 'store'])
                ->name('store');
            Route::get('{expense}', [ExpenseController::class, 'show'])
                ->name('show');
            Route::put('{expense}', [ExpenseController::class, 'update'])
                ->name('update');
            Route::delete('{expense}', [ExpenseController::class, 'destroy'])
                ->name('destroy');
        });

        // Step 13: Investment Management

        Route::get('investments/export/{format}', [InvestmentController::class, 'export'])
            ->middleware('throttle:20,1')
            ->name('investments.export');

        Route::post('investments/{id}/restore', [InvestmentController::class, 'restore'])
            ->name('investments.restore');

        Route::resource('investments', InvestmentController::class)
            ->only(['index', 'store', 'show', 'update', 'destroy']);

            // ── Step 14: Profit Distributions ──────────────────────────────────
        // calculate-preview, approve, distribute, restore declared BEFORE
        // resource() to prevent {profit_distribution} wildcard swallowing them
        // Route::get('profit-distributions/calculate-preview', [ProfitDistributionController::class, 'calculatePreview'])
        //     ->name('profit-distributions.calculate-preview');

        // Route::post('profit-distributions/{id}/approve', [ProfitDistributionController::class, 'approve'])
        //     ->name('profit-distributions.approve');

        // Route::post('profit-distributions/{id}/distribute', [ProfitDistributionController::class, 'distribute'])
        //     ->name('profit-distributions.distribute');

        // Route::post('profit-distributions/{id}/restore', [ProfitDistributionController::class, 'restore'])
        //     ->name('profit-distributions.restore');

        // Route::patch('profit-distributions/{profit_distribution}/items/{item}/payment', [ProfitDistributionController::class, 'updateItemPayment'])
        //     ->name('profit-distributions.items.payment');

        // Route::resource('profit-distributions', ProfitDistributionController::class)
        //     ->except(['create', 'store', 'show', 'edit', 'update', 'destroy'])
        //     ->names([]);
        // Route::get('profit-distributions/create', [ProfitDistributionController::class, 'create'])
        //     ->name('profit-distributions.create');
        // Route::post('profit-distributions', [ProfitDistributionController::class, 'store'])
        //     ->name('profit-distributions.store');
        // Route::get('profit-distributions/{profit_distribution}', [ProfitDistributionController::class, 'show'])
        //     ->name('profit-distributions.show');
        // Route::get('profit-distributions/{profit_distribution}/edit', [ProfitDistributionController::class, 'edit'])
        //     ->name('profit-distributions.edit');
        // Route::put('profit-distributions/{profit_distribution}', [ProfitDistributionController::class, 'update'])
        //     ->name('profit-distributions.update');
        // Route::delete('profit-distributions/{profit_distribution}', [ProfitDistributionController::class, 'destroy'])
        //     ->name('profit-distributions.destroy');

        // ─────────────────────────────────────────────────────────────
        // Step 15 — Dashboard & Analytics
        // data route declared BEFORE resource to prevent wildcard clash
        // ─────────────────────────────────────────────────────────────
        Route::get('dashboard/data', [DashboardController::class, 'data'])
            ->name('dashboard.data');

        Route::get('dashboard', [DashboardController::class, 'index'])
            ->name('dashboard.index');

        // ── Step 16: Reports ──────────────────────────────────────────────────────────
        // Export route BEFORE named report routes to prevent {type} swallowing segments
        Route::get('/reports/{type}/export/{fmt}', [ReportController::class, 'export'])
            ->middleware('throttle:20,1')
            ->name('reports.export');

        Route::get('/reports',                [ReportController::class, 'index'])
            ->name('reports.index');
        Route::get('/reports/sales',          [ReportController::class, 'sales'])
            ->name('reports.sales');
        Route::get('/reports/purchases',      [ReportController::class, 'purchases'])
            ->name('reports.purchases');
        Route::get('/reports/expenses',       [ReportController::class, 'expenses'])
            ->name('reports.expenses');
        Route::get('/reports/profit-loss',    [ReportController::class, 'profitLoss'])
            ->name('reports.profit-loss');
        Route::get('/reports/inventory',      [ReportController::class, 'inventory'])
            ->name('reports.inventory');
        Route::get('/reports/customer-ledger',[ReportController::class, 'customerLedger'])
            ->name('reports.customer-ledger');
        Route::get('/reports/investments',    [ReportController::class, 'investments'])
            ->name('reports.investments');


        // ── Step 17: Profit Distributions (replaces Step 14 routes entirely) ──────
        Route::prefix('profit-distributions')->name('profit-distributions.')->group(function () {

            // ── Special routes — declared BEFORE resource() ───────────────────────

            // Calculate preview
            Route::get('calculate-preview', [ProfitDistributionController::class, 'calculatePreview'])
                ->name('calculate-preview');

            // Reverse distribution (Step 17)
            Route::post('{id}/reverse', [DistributionReverseController::class, '__invoke'])
                ->name('reverse');

            // Approve / Distribute / Restore
            Route::post('{id}/approve',    [ProfitDistributionController::class, 'approve'])
                ->name('approve');
            Route::post('{id}/distribute', [ProfitDistributionController::class, 'distribute'])
                ->name('distribute');
            Route::post('{id}/restore',    [ProfitDistributionController::class, 'restore'])
                ->name('restore');

            // ── Item payment routes (Step 17 — full payment lifecycle) ───────────
            Route::prefix('{pd}/items/{item}')->name('items.')->group(function () {
                Route::get('payments',                    [ProfitPaymentController::class, 'index'])
                    ->name('payments.index');
                Route::patch('payments',                  [ProfitPaymentController::class, 'store'])
                    ->name('payments.store');
                Route::delete('payments/{payment}',       [ProfitPaymentController::class, 'cancel'])
                    ->name('payments.cancel');
                Route::patch('payments/{payment}/reopen', [ProfitPaymentController::class, 'reopen'])
                    ->name('payments.reopen');
            });

            // ── Eligibility override (Step 17) ────────────────────────────────────
            Route::post(
                '{pd}/eligibilities/{eligibility}/override',
                [ProfitDistributionController::class, 'overrideEligibility']
            )->name('eligibilities.override');

            // ── Legacy item payment (Step 14 — kept for backward compat) ─────────
            Route::patch(
                '{profit_distribution}/items/{item}/payment',
                [ProfitDistributionController::class, 'updateItemPayment']
            )->name('items.payment');

            // ── CRUD routes ───────────────────────────────────────────────────────
            Route::get('/',                          [ProfitDistributionController::class, 'index'])
                ->name('index');
            Route::get('create',                     [ProfitDistributionController::class, 'create'])
                ->name('create');
            Route::post('/',                         [ProfitDistributionController::class, 'store'])
                ->name('store');
            Route::get('{profit_distribution}',      [ProfitDistributionController::class, 'show'])
                ->name('show');
            Route::get('{profit_distribution}/edit', [ProfitDistributionController::class, 'edit'])
                ->name('edit');
            Route::put('{profit_distribution}',      [ProfitDistributionController::class, 'update'])
                ->name('update');
            Route::delete('{profit_distribution}',   [ProfitDistributionController::class, 'destroy'])
                ->name('destroy');
        });

        // ── Investor Balances (Step 17) ───────────────────────────────────────────
        Route::prefix('investor-balances')->name('investor-balances.')->group(function () {
            Route::get('/',            [InvestorBalanceController::class, 'index'])->name('index');
            Route::get('{investment}', [InvestorBalanceController::class, 'show'])->name('show');
        });

        // ─── Capital Ledger ───────────────────────────────────────────────────────────
        // Withdrawal actions BEFORE resource-style routes (prevent wildcard swallowing)
        Route::post('capital-withdrawals/{entry}/approve', [CapitalWithdrawalController::class, 'approve'])
            ->name('capital-withdrawals.approve');
        Route::post('capital-withdrawals/{entry}/reject', [CapitalWithdrawalController::class, 'reject'])
            ->name('capital-withdrawals.reject');
        Route::post('capital-withdrawals/{entry}/cancel', [CapitalWithdrawalController::class, 'cancel'])
            ->name('capital-withdrawals.cancel');
        Route::post('capital-withdrawals', [CapitalWithdrawalController::class, 'store'])
            ->name('capital-withdrawals.store');

        // Capital Ledger — index + show + store (deposit/adjustment/withdrawal request)
        Route::get('capital-ledger', [CapitalLedgerController::class, 'index'])
            ->name('capital-ledger.index');
        Route::post('capital-ledger', [CapitalLedgerController::class, 'store'])
            ->name('capital-ledger.store');
        Route::get('capital-ledger/{investmentId}', [CapitalLedgerController::class, 'show'])
            ->name('capital-ledger.show');

        // Investor Statements (read-only — export before resource pattern)
        Route::get('investor-statements/{investment}/pdf', [InvestorStatementController::class, 'pdf'])
            ->name('investor-statements.pdf');

        Route::get('investor-statements', [InvestorStatementController::class, 'index'])
            ->name('investor-statements.index');

        Route::get('investor-statements/{investment}', [InvestorStatementController::class, 'show'])
            ->name('investor-statements.show');


        // -------------------------------------------------------------------------
        // Partners
        // -------------------------------------------------------------------------
        Route::prefix('partners')->name('partners.')->group(function () {

            // Bulk action — BEFORE resource to prevent wildcard swallowing
            Route::post('bulk-action', [PartnerController::class, 'bulkAction'])
                ->name('bulk-action');

            // Restore — BEFORE resource
            Route::post('{id}/restore', [PartnerController::class, 'restore'])
                ->name('restore');

            // Force delete — BEFORE resource
            Route::delete('{id}/force-delete', [PartnerController::class, 'forceDelete'])
                ->name('force-delete');

            // Link / Unlink investment
            Route::post('{partner}/link-investment', [PartnerController::class, 'linkInvestment'])
                ->name('link-investment');
            Route::delete('{partner}/investments/{partnerInvestment}/unlink', [PartnerController::class, 'unlinkInvestment'])
                ->name('unlink-investment');

            // Profit Rules (nested) — BEFORE wildcard {partner} routes
            Route::post('{partner}/profit-rules', [PartnerProfitRuleController::class, 'store'])
                ->name('profit-rules.store');
            Route::put('{partner}/profit-rules/{profitRule}', [PartnerProfitRuleController::class, 'update'])
                ->name('profit-rules.update');
            Route::post('{partner}/profit-rules/{profitRule}/approve', [PartnerProfitRuleController::class, 'approve'])
                ->name('profit-rules.approve');
            Route::delete('{partner}/profit-rules/{profitRule}', [PartnerProfitRuleController::class, 'destroy'])
                ->name('profit-rules.destroy');

            // Eligibility (nested) — BEFORE wildcard {partner} routes
            Route::post('{partner}/eligibilities', [PartnerEligibilityController::class, 'store'])
                ->name('eligibilities.store');
            Route::post('{partner}/eligibilities/{eligibility}/pause', [PartnerEligibilityController::class, 'pause'])
                ->name('eligibilities.pause');
            Route::post('{partner}/eligibilities/{eligibility}/resume', [PartnerEligibilityController::class, 'resume'])
                ->name('eligibilities.resume');
            Route::post('{partner}/eligibilities/{eligibility}/end', [PartnerEligibilityController::class, 'end'])
                ->name('eligibilities.end');

            // Settlement Configs — nested under partners/{partner}
            Route::post('{partner}/settlement-configs', [PartnerSettlementConfigController::class, 'store'])
                ->name('settlement-configs.store');
            Route::put('{partner}/settlement-configs/{config}', [PartnerSettlementConfigController::class, 'update'])
                ->name('settlement-configs.update');
            Route::delete('{partner}/settlement-configs/{config}', [PartnerSettlementConfigController::class, 'destroy'])
                ->name('settlement-configs.destroy');

            // ── Explicit CRUD routes ──
            Route::get('/', [PartnerController::class, 'index'])->name('index');
            Route::post('/', [PartnerController::class, 'store'])->name('store');
            Route::get('/{partner}', [PartnerController::class, 'show'])->name('show');
            Route::put('/{partner}', [PartnerController::class, 'update'])->name('update');
            Route::delete('/{partner}', [PartnerController::class, 'destroy'])->name('destroy');
        });
    });


require __DIR__.'/auth.php';
