<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StorePaymentMethodRequest;
use App\Http\Requests\Backend\UpdatePaymentMethodRequest;
use App\Models\PaymentMethod;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
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
        ]);
    }

    public function store(StorePaymentMethodRequest $request): RedirectResponse
    {
        $paymentMethod = PaymentMethod::create($request->validated());

        ActivityLogService::log(
            'payment_method',
            'created',
            'Payment method created: ' . $paymentMethod->name,
            $paymentMethod->id,
            $paymentMethod->toArray()
        );

        return back()->with('success', 'Payment method created successfully.');
    }

    public function update(UpdatePaymentMethodRequest $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $paymentMethod->update($request->validated());

        ActivityLogService::log(
            'payment_method',
            'updated',
            'Payment method updated: ' . $paymentMethod->name,
            $paymentMethod->id,
            $request->validated()
        );

        return back()->with('success', 'Payment method updated successfully.');
    }

    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        abort_unless(Gate::allows('payment_method.delete'), 403);

        $paymentMethod->delete();

        ActivityLogService::log(
            'payment_method',
            'deleted',
            'Payment method deleted: ' . $paymentMethod->name,
            $paymentMethod->id,
            ['name' => $paymentMethod->name]
        );

        return back()->with('success', 'Payment method deleted successfully.');
    }
}
