<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreExpenseCategoryRequest;
use App\Http\Requests\Backend\UpdateExpenseCategoryRequest;
use App\Models\ExpenseCategory;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseCategoryController extends Controller
{
    public function index(): Response
    {
        abort_unless(Gate::allows('expense_category.view'), 403);

        $categories = ExpenseCategory::withTrashed()
            ->orderBy('name')
            ->get();

        return Inertia::render('Backend/Settings/ExpenseCategories', [
            'categories' => $categories,
        ]);
    }

    public function store(StoreExpenseCategoryRequest $request): RedirectResponse
    {
        $category = ExpenseCategory::create($request->validated());

        ActivityLogService::log(
            'expense_category',
            'created',
            'Expense category created: ' . $category->name,
            $category,              // ✅ object, id না
            $category->toArray()
        );

        return back()->with('success', 'Expense category created successfully.');
    }

    public function update(UpdateExpenseCategoryRequest $request, ExpenseCategory $expenseCategory): RedirectResponse
    {
        $expenseCategory->update($request->validated());

        ActivityLogService::log(
            'expense_category', 'updated',
            'Expense category updated: ' . $expenseCategory->name,
            $expenseCategory,        // ✅ object
            $request->validated()
        );

        return back()->with('success', 'Expense category updated successfully.');
    }

    public function destroy(ExpenseCategory $expenseCategory): RedirectResponse
    {
        abort_unless(Gate::allows('expense_category.delete'), 403);

        $expenseCategory->delete();

        ActivityLogService::log(
            'expense_category', 'deleted',
            'Expense category deleted: ' . $expenseCategory->name,
            $expenseCategory,        // ✅ object
            ['name' => $expenseCategory->name]
        );

        return back()->with('success', 'Expense category deleted successfully.');
    }
}
