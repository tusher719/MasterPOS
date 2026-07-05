<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreCustomerRequest;
use App\Http\Requests\Backend\UpdateCustomerRequest;
use App\Models\Customer;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class CustomerController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request)
    {
        $this->authorize('view', Customer::class);

        $query = Customer::query();

        // Trash filter
        if ($request->boolean('trashed')) {
            $query->onlyTrashed();
        }

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('is_active', $request->input('status') === 'active');
        }

        $customers = $query
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        // Stats (always from non-trashed)
        $stats = [
            'total'         => Customer::count(),
            'active'        => Customer::active()->count(),
            'inactive'      => Customer::where('is_active', false)->count(),
            'total_balance' => Customer::sum('opening_balance'),
        ];

        return Inertia::render('Backend/Customers/Index', [
            'customers' => $customers,
            'stats'     => $stats,
            'filters'   => $request->only(['search', 'status', 'trashed']),
            'can'       => [
                'create'  => $request->user()->can('create', Customer::class),
                'edit'    => $request->user()->can('edit', Customer::class),
                'delete'  => $request->user()->can('delete', Customer::class),
                'restore' => $request->user()->can('restore', Customer::class),
            ],
        ]);
    }

    public function store(StoreCustomerRequest $request)
    {
        $customer = Customer::create($request->validated());

        ActivityLogService::log(
            'customers',
            'create',
            "Created customer: {$customer->name}",
            $customer,
            $request->validated()
        );

        return back()->with('success', 'Customer created successfully.');
    }

    public function update(UpdateCustomerRequest $request, Customer $customer)
    {
        $old = $customer->toArray();

        $customer->update($request->validated());

        ActivityLogService::log(
            'customers',
            'update',
            "Updated customer: {$customer->name}",
            $customer,
            ['old' => $old, 'new' => $request->validated()]
        );

        return back()->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        $this->authorize('delete', $customer);

        $customer->delete();

        ActivityLogService::log(
            'customers',
            'delete',
            "Deleted customer: {$customer->name}",
            $customer
        );

        return back()->with('success', 'Customer deleted successfully.');
    }

    public function restore(int $id)
    {
        $this->authorize('restore', Customer::class);

        $customer = Customer::onlyTrashed()->findOrFail($id);
        $customer->restore();

        ActivityLogService::log(
            'customers',
            'restore',
            "Restored customer: {$customer->name}",
            $customer
        );

        return back()->with('success', 'Customer restored successfully.');
    }
}
