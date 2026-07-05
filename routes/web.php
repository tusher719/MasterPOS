<?php

use App\Http\Controllers\Backend\ActivityLogController;
use App\Http\Controllers\Backend\CustomerController;
use App\Http\Controllers\Backend\LoginHistoryController;
use App\Http\Controllers\Backend\RoleController;
use App\Http\Controllers\Backend\UserController;
use App\Http\Controllers\Backend\SettingController;
use App\Http\Controllers\Backend\PaymentMethodController;
use App\Http\Controllers\Backend\ExpenseCategoryController;
use App\Http\Controllers\Backend\InvestmentTypeController;
use App\Http\Controllers\Backend\InvoiceController;
use App\Http\Controllers\Backend\NotificationController;
use App\Http\Controllers\Backend\ProductCategoryController;
use App\Http\Controllers\Backend\ProductController;
use App\Http\Controllers\Backend\PurchaseController;
use App\Http\Controllers\Backend\PurchasePaymentController;
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
            Route::post('/logo', [SettingController::class, 'uploadLogo'])->name('logo');
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
            Route::get('/{sale}/pdf', [InvoiceController::class, 'pdf'])->name('pdf');
        });

    });


require __DIR__.'/auth.php';
