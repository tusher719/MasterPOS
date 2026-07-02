<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreInvestmentTypeRequest;
use App\Http\Requests\Backend\UpdateInvestmentTypeRequest;
use App\Models\InvestmentType;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class InvestmentTypeController extends Controller
{
    public function index(): Response
    {
        abort_unless(Gate::allows('investment_type.view'), 403);

        $investmentTypes = InvestmentType::withTrashed()
            ->orderBy('name')
            ->get();

        return Inertia::render('Backend/Settings/InvestmentTypes', [
            'investmentTypes' => $investmentTypes,
        ]);
    }

    public function store(StoreInvestmentTypeRequest $request): RedirectResponse
    {
        $type = InvestmentType::create($request->validated());

        ActivityLogService::log(
            'investment_type',
            'created',
            'Investment type created: ' . $type->name,
            $type->id,
            $type->toArray()
        );

        return back()->with('success', 'Investment type created successfully.');
    }

    public function update(UpdateInvestmentTypeRequest $request, InvestmentType $investmentType): RedirectResponse
    {
        $investmentType->update($request->validated());

        ActivityLogService::log(
            'investment_type',
            'updated',
            'Investment type updated: ' . $investmentType->name,
            $investmentType->id,
            $request->validated()
        );

        return back()->with('success', 'Investment type updated successfully.');
    }

    public function destroy(InvestmentType $investmentType): RedirectResponse
    {
        abort_unless(Gate::allows('investment_type.delete'), 403);

        $investmentType->delete();

        ActivityLogService::log(
            'investment_type',
            'deleted',
            'Investment type deleted: ' . $investmentType->name,
            $investmentType->id,
            ['name' => $investmentType->name]
        );

        return back()->with('success', 'Investment type deleted successfully.');
    }
}
