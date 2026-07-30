<?php
// app/Http/Controllers/Backend/PaymentMethodController.php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    public function index(): Response
    {
        abort_unless(Gate::allows('payment_method.view'), 403);

        $paymentMethods = PaymentMethod::withTrashed()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('Backend/Settings/PaymentMethods', [
            'paymentMethods' => $paymentMethods,
            'can' => [
                'create' => Gate::allows('payment_method.create'),
                'edit'   => Gate::allows('payment_method.edit'),
                'delete' => Gate::allows('payment_method.delete'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless(Gate::allows('payment_method.create'), 403);

        $data = $request->validate([
            'name'                 => 'required|string|max:100',
            'type'                 => 'required|in:cash,card,mobile_banking,other',
            'is_active'            => 'boolean',
            'sort_order'           => 'integer|min:0',
            'charge_enabled'       => 'boolean',
            'online_charge_type'   => 'nullable|in:percent,fixed',
            'online_charge_value'  => 'nullable|numeric|min:0|max:99999.99',
            'charge_label'         => 'nullable|string|max:100',
        ]);

        // charge_type required when charge is enabled
        if (! empty($data['charge_enabled']) && empty($data['online_charge_type'])) {
            return back()->withErrors([
                'online_charge_type' => 'Charge type is required when charge is enabled.',
            ]);
        }

        $paymentMethod = PaymentMethod::create($data);

        ActivityLogService::log(
            'payment_method',
            'created',
            'Payment method created: ' . $paymentMethod->name,
            $paymentMethod,
            $paymentMethod->toArray()
        );

        return back()->with('success', 'Payment method created successfully.');
    }

    public function update(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        abort_unless(Gate::allows('payment_method.edit'), 403);

        $data = $request->validate([
            'name'                 => 'required|string|max:100',
            'type'                 => 'required|in:cash,card,mobile_banking,other',
            'is_active'            => 'boolean',
            'sort_order'           => 'integer|min:0',
            'charge_enabled'       => 'boolean',
            'online_charge_type'   => 'nullable|in:percent,fixed',
            'online_charge_value'  => 'nullable|numeric|min:0|max:99999.99',
            'charge_label'         => 'nullable|string|max:100',
        ]);

        if (! empty($data['charge_enabled']) && empty($data['online_charge_type'])) {
            return back()->withErrors([
                'online_charge_type' => 'Charge type is required when charge is enabled.',
            ]);
        }

        $paymentMethod->update($data);

        ActivityLogService::log(
            'payment_method',
            'updated',
            'Payment method updated: ' . $paymentMethod->name,
            $paymentMethod,
            $data
        );

        return back()->with('success', 'Payment method updated successfully.');
    }

    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        abort_unless(Gate::allows('payment_method.delete'), 403);

        ActivityLogService::log(
            'payment_method',
            'deleted',
            'Payment method deleted: ' . $paymentMethod->name,
            $paymentMethod,
            ['name' => $paymentMethod->name]
        );

        $paymentMethod->delete();

        return back()->with('success', 'Payment method deleted successfully.');
    }
}
