<?php

use App\Http\Controllers\Backend\ActivityLogController;
use App\Http\Controllers\Backend\LoginHistoryController;
use App\Http\Controllers\Backend\RoleController;
use App\Http\Controllers\Backend\UserController;
use App\Http\Controllers\Backend\SettingController;
use App\Http\Controllers\Backend\PaymentMethodController;
use App\Http\Controllers\Backend\ExpenseCategoryController;
use App\Http\Controllers\Backend\InvestmentTypeController;
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
    });


require __DIR__.'/auth.php';
