<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreExpenseRequest;
use App\Http\Requests\Backend\UpdateExpenseRequest;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\PaymentMethod;
use App\Services\ActivityLogService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    use AuthorizesRequests;

    // -------------------------------------------------------------------------
    // INDEX
    // -------------------------------------------------------------------------
    public function index(Request $request): Response
    {
        $this->authorize('view', Expense::class);

        $query = Expense::with(['category', 'paymentMethod', 'creator'])
            ->when($request->boolean('trashed'), fn ($q) => $q->onlyTrashed());

        // Search: reference_no, title, reference
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->filled('category_id')) {
            $query->where('expense_category_id', $request->category_id);
        }

        // Payment method filter
        if ($request->filled('payment_method_id')) {
            $query->where('payment_method_id', $request->payment_method_id);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('expense_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('expense_date', '<=', $request->date_to);
        }

        // Amount range filter
        if ($request->filled('amount_min')) {
            $query->where('amount', '>=', $request->amount_min);
        }
        if ($request->filled('amount_max')) {
            $query->where('amount', '<=', $request->amount_max);
        }

        $expenses = $query->orderByDesc('expense_date')
                          ->orderByDesc('id')
                          ->paginate(15)
                          ->withQueryString();

        // Stats (active records only)
        $stats = [
            'today'      => Expense::whereDate('expense_date', today())->sum('amount'),
            'this_month' => Expense::whereYear('expense_date', now()->year)
                                   ->whereMonth('expense_date', now()->month)
                                   ->sum('amount'),
            'this_year'  => Expense::whereYear('expense_date', now()->year)->sum('amount'),
            'all_time'   => Expense::sum('amount'),
        ];

        $can = [
            'create'  => Gate::allows('create', Expense::class),
            'edit'    => Gate::allows('edit', Expense::class),
            'delete'  => Gate::allows('delete', Expense::class),
            'restore' => Gate::allows('restore', Expense::class),
        ];

        return Inertia::render('Backend/Expenses/Index', [
            'expenses'       => $expenses,
            'stats'          => $stats,
            'categories'     => ExpenseCategory::orderBy('name')->get(['id', 'name']),
            'paymentMethods' => PaymentMethod::where('is_active', true)
                                             ->orderBy('name')
                                             ->get(['id', 'name']),
            'filters'        => $request->only([
                'search', 'category_id', 'payment_method_id',
                'date_from', 'date_to', 'amount_min', 'amount_max', 'trashed',
            ]),
            'can'            => $can,
        ]);
    }

    // -------------------------------------------------------------------------
    // STORE
    // -------------------------------------------------------------------------
    public function store(StoreExpenseRequest $request)
    {
        $this->authorize('create', Expense::class);

        $data = $request->validated();

        DB::transaction(function () use ($data, $request) {
            // Handle attachment upload
            if ($request->hasFile('attachment')) {
                $data['attachment'] = $request->file('attachment')
                    ->store('expenses', 'public');
            }

            $data['reference_no'] = Expense::generateReference();
            $data['created_by']   = Auth::id();

            $expense = Expense::create($data);

            $expense->load('category');

            ActivityLogService::log(
                'expense',
                'create',
                "Expense '{$expense->title}' created — Amount: {$expense->amount}, Category: {$expense->category->name}",
                $expense,
                [
                    'reference_no' => $expense->reference_no,
                    'title'        => $expense->title,
                    'amount'       => $expense->amount,
                    'category'     => $expense->category->name,
                ]
            );
        });

        return back()->with('success', 'Expense recorded successfully.');
    }

    // -------------------------------------------------------------------------
    // SHOW
    // -------------------------------------------------------------------------
    public function show(Expense $expense): Response
    {
        $this->authorize('view', Expense::class);

        $expense->load(['category', 'paymentMethod', 'creator', 'updater']);

        $can = [
            'edit'   => Gate::allows('edit', Expense::class),
            'delete' => Gate::allows('delete', Expense::class),
        ];

        return Inertia::render('Backend/Expenses/Show', [
            'expense' => array_merge($expense->toArray(), [
                'attachment_url'  => $expense->attachment_url,
                'attachment_mime' => $expense->attachment_mime,
            ]),
            'can'            => $can,
            'categories'     => ExpenseCategory::orderBy('name')->get(['id', 'name']),
            'paymentMethods' => PaymentMethod::where('is_active', true)
                                            ->orderBy('name')
                                            ->get(['id', 'name']),
        ]);
    }

    // -------------------------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------------------------
    public function update(UpdateExpenseRequest $request, Expense $expense)
    {
        $this->authorize('edit', Expense::class);

        $data = $request->validated();

        DB::transaction(function () use ($data, $request, $expense) {
            // Remove attachment if requested
            if ($request->boolean('remove_attachment') && $expense->attachment) {
                Storage::disk('public')->delete($expense->attachment);
                $data['attachment'] = null;
            }

            // Replace attachment if new file uploaded
            if ($request->hasFile('attachment')) {
                if ($expense->attachment) {
                    Storage::disk('public')->delete($expense->attachment);
                }
                $data['attachment'] = $request->file('attachment')
                    ->store('expenses', 'public');
            }

            $data['updated_by'] = Auth::id();

            $expense->update($data);

            $expense->load('category');

            ActivityLogService::log(
                'expense',
                'update',
                "Expense '{$expense->title}' updated — Amount: {$expense->amount}, Category: {$expense->category->name}",
                $expense,
                [
                    'reference_no' => $expense->reference_no,
                    'title'        => $expense->title,
                    'amount'       => $expense->amount,
                    'category'     => $expense->category->name,
                ]
            );
        });

        return back()->with('success', 'Expense updated successfully.');
    }

    // -------------------------------------------------------------------------
    // DESTROY (soft delete)
    // -------------------------------------------------------------------------
    public function destroy(Expense $expense)
    {
        $this->authorize('delete', Expense::class);

        $expense->load('category');

        ActivityLogService::log(
            'expense',
            'delete',
            "Expense '{$expense->title}' deleted — Amount: {$expense->amount}, Category: {$expense->category->name}",
            $expense,
            [
                'reference_no' => $expense->reference_no,
                'title'        => $expense->title,
                'amount'       => $expense->amount,
                'category'     => $expense->category->name,
            ]
        );

        $expense->delete();

        return back()->with('success', 'Expense moved to trash.');
    }

    // -------------------------------------------------------------------------
    // RESTORE
    // -------------------------------------------------------------------------
    public function restore(int $id)
    {
        $this->authorize('restore', Expense::class);

        $expense = Expense::onlyTrashed()->findOrFail($id);

        $expense->load('category');

        $expense->restore();

        ActivityLogService::log(
            'expense',
            'restore',
            "Expense '{$expense->title}' restored — Amount: {$expense->amount}, Category: {$expense->category->name}",
            $expense,
            [
                'reference_no' => $expense->reference_no,
                'title'        => $expense->title,
                'amount'       => $expense->amount,
                'category'     => $expense->category->name,
            ]
        );

        return back()->with('success', 'Expense restored successfully.');
    }

    // -------------------------------------------------------------------------
    // BULK ACTION
    // -------------------------------------------------------------------------
    public function bulkAction(Request $request)
    {
        $request->validate([
            'action' => ['required', 'in:delete,restore'],
            'ids'    => ['required', 'array', 'min:1'],
            'ids.*'  => ['integer'],
        ]);

        $user   = Auth::user();
        $action = $request->action;
        $ids    = $request->ids;

        if ($action === 'delete') {
            // Use Gate to check permission in case the User model
            // does not implement the 'can' method.
            abort_unless(Gate::allows('expense.delete'), 403);

            $expenses = Expense::whereIn('id', $ids)->get();

            foreach ($expenses as $expense) {
                $expense->load('category');

                ActivityLogService::log(
                    'expense',
                    'delete',
                    "Expense '{$expense->title}' bulk deleted — Amount: {$expense->amount}, Category: {$expense->category->name}",
                    $expense,
                    [
                        'reference_no' => $expense->reference_no,
                        'title'        => $expense->title,
                        'amount'       => $expense->amount,
                        'category'     => $expense->category->name,
                    ]
                );

                $expense->delete();
            }

            return back()->with('success', count($expenses) . ' expense(s) moved to trash.');
        }

        if ($action === 'restore') {
            // Use Gate to check permission in case the User model
            // does not implement the 'hasPermissionTo' method.
            abort_unless(Gate::allows('expense.restore'), 403);

            $expenses = Expense::onlyTrashed()->whereIn('id', $ids)->get();

            foreach ($expenses as $expense) {
                $expense->restore();

                $expense->load('category');

                ActivityLogService::log(
                    'expense',
                    'restore',
                    "Expense '{$expense->title}' bulk restored — Amount: {$expense->amount}, Category: {$expense->category->name}",
                    $expense,
                    [
                        'reference_no' => $expense->reference_no,
                        'title'        => $expense->title,
                        'amount'       => $expense->amount,
                        'category'     => $expense->category->name,
                    ]
                );
            }

            return back()->with('success', count($expenses) . ' expense(s) restored.');
        }
    }

    // -------------------------------------------------------------------------
    // EXPORT (hook point — implementation deferred to future step)
    // -------------------------------------------------------------------------
    // public function export(Request $request)
    // {
    //     $this->authorize('view', Expense::class);
    //     // TODO: Stream CSV using fputcsv()
    //     // Columns: reference_no, title, category, payment_method,
    //     //          amount, expense_date, reference, note, created_by, created_at
    // }
}
