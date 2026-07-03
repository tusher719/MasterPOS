<?php
// app/Http/Controllers/Backend/UnitController.php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreUnitRequest;
use App\Http\Requests\Backend\UpdateUnitRequest;
use App\Models\Unit;
use App\Services\ActivityLogService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    use AuthorizesRequests;
    public function index(): Response
    {
        $this->authorize('viewAny', Unit::class);

        $units = Unit::orderBy('name')
            ->get()
            ->map(fn($unit) => [
                'id'           => $unit->id,
                'name'         => $unit->name,
                'short_code'   => $unit->short_code,
                'is_active'    => $unit->is_active,
                'product_count' => $unit->products()->count(),
            ]);

        return Inertia::render('Backend/Products/Units/Index', [
            'units' => $units,
        ]);
    }

    public function store(StoreUnitRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['is_active'] = $request->boolean('is_active', true);

        $unit = Unit::create($data);

        ActivityLogService::log(
            'unit',
            'created',
            "Unit '{$unit->name} ({$unit->short_code})' created",
            $unit->id,
            $unit->toArray()
        );

        return back()->with('success', 'Unit created successfully.');
    }

    public function update(UpdateUnitRequest $request, Unit $unit): RedirectResponse
    {
        $data = $request->validated();
        $data['is_active'] = $request->boolean('is_active');

        $unit->update($data);

        ActivityLogService::log(
            'unit',
            'updated',
            "Unit '{$unit->name} ({$unit->short_code})' updated",
            $unit->id,
            $unit->toArray()
        );

        return back()->with('success', 'Unit updated successfully.');
    }

    public function destroy(Unit $unit): RedirectResponse
    {
        $this->authorize('delete', $unit);

        // Prevent delete if unit is in use
        if ($unit->products()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete a unit that is assigned to products.']);
        }

        ActivityLogService::log(
            'unit',
            'deleted',
            "Unit '{$unit->name} ({$unit->short_code})' deleted",
            $unit->id
        );

        $unit->delete();

        return back()->with('success', 'Unit deleted successfully.');
    }
}
