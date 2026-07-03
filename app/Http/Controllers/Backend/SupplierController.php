<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreSupplierRequest;
use App\Http\Requests\Backend\UpdateSupplierRequest;
use App\Models\Supplier;
use App\Services\ActivityLogService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request)
{
    $this->authorize('view', Supplier::class);

    $query = Supplier::query();

    if ($request->boolean('trashed')) {
        $query->onlyTrashed();
    }

    if ($request->filled('status') && in_array($request->status, ['active', 'inactive'])) {
        $query->where('is_active', $request->status === 'active');
    }

    if ($request->filled('search')) {
        $search = $request->search;
        $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('company', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%")
              ->orWhere('phone', 'like', "%{$search}%");
        });
    }

    $suppliers = $query->latest()->paginate(15)->withQueryString();

    $stats = [
        'total'         => Supplier::count(),
        'active'        => Supplier::where('is_active', true)->count(),
        'inactive'      => Supplier::where('is_active', false)->count(),
        'total_payable' => Supplier::sum('opening_balance'),
    ];

    return Inertia::render('Backend/Suppliers/Index', [
        'suppliers' => $suppliers,
        'stats'     => $stats,
        'filters'   => $request->only(['search', 'status', 'trashed']),
        'can'       => [
            'create'  => $request->user()->can('create', Supplier::class),
            'edit'    => $request->user()->can('update', new Supplier()),
            'delete'  => $request->user()->can('delete', new Supplier()),
            'restore' => $request->user()->can('restore', new Supplier()),
        ],
    ]);
}

    public function store(StoreSupplierRequest $request)
    {
        $supplier = Supplier::create([
            'name'            => $request->name,
            'company'         => $request->company,
            'email'           => $request->email,
            'phone'           => $request->phone,
            'address'         => $request->address,
            'city'            => $request->city,
            'country'         => $request->country ?? 'Bangladesh',
            'opening_balance' => $request->opening_balance ?? 0.00,
            'is_active'       => $request->boolean('is_active', true),
        ]);

        ActivityLogService::log(
            'supplier',
            'create',
            "Created supplier: {$supplier->name}",
            $supplier,              // was $supplier->id
            $supplier->toArray()
        );

        return redirect()->back()->with('success', 'Supplier created successfully.');
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier)
    {
        $old = $supplier->toArray();

        $supplier->update([
            'name'            => $request->name,
            'company'         => $request->company,
            'email'           => $request->email,
            'phone'           => $request->phone,
            'address'         => $request->address,
            'city'            => $request->city,
            'country'         => $request->country ?? 'Bangladesh',
            'opening_balance' => $request->opening_balance ?? 0.00,
            'is_active'       => $request->boolean('is_active', true),
        ]);

        ActivityLogService::log(
            'supplier',
            'update',
            "Updated supplier: {$supplier->name}",
            $supplier,              // was $supplier->id
            ['old' => $old, 'new' => $supplier->fresh()->toArray()]
        );

        return redirect()->back()->with('success', 'Supplier updated successfully.');
    }

    public function destroy(Supplier $supplier)
    {
        $this->authorize('delete', $supplier);

        $supplier->delete();

        ActivityLogService::log(
            'supplier',
            'delete',
            "Deleted supplier: {$supplier->name}",
            $supplier
        );

        return redirect()->back()->with('success', 'Supplier deleted successfully.');
    }

    public function restore(int $id)
    {
        $supplier = Supplier::onlyTrashed()->findOrFail($id);

        $this->authorize('restore', $supplier);

        $supplier->restore();

        ActivityLogService::log(
            'supplier',
            'restore',
            "Restored supplier: {$supplier->name}",
            $supplier
        );

        return redirect()->back()->with('success', 'Supplier restored successfully.');
    }
}
