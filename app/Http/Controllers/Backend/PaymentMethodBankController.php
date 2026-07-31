<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Models\PaymentMethodBank;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PaymentMethodBankController extends Controller
{
    public function store(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        abort_unless(Gate::allows('payment_method.edit'), 403);

        $data = $request->validate([
            'bank_name'      => 'required|string|max:100',
            'account_number' => 'nullable|string|max:100',
            'account_name'   => 'nullable|string|max:100',
            'charge_enabled' => 'boolean',
            'charge_type'    => 'nullable|in:percent,fixed',
            'charge_value'   => 'nullable|numeric|min:0|max:99999.99',
            'charge_label'   => 'nullable|string|max:100',
            'is_active'      => 'boolean',
            'sort_order'     => 'integer|min:0',
        ]);

        // charge_type required when charge is enabled
        if (! empty($data['charge_enabled']) && empty($data['charge_type'])) {
            return back()->withErrors([
                'charge_type' => 'Charge type is required when charge is enabled.',
            ]);
        }

        $data['payment_method_id'] = $paymentMethod->id;

        $bank = PaymentMethodBank::create($data);

        ActivityLogService::log(
            'payment_method_bank',
            'created',
            "Bank added: {$bank->bank_name} under {$paymentMethod->name}",
            $bank,
            $bank->toArray()
        );

        return back()->with('success', 'Bank added successfully.');
    }

    public function update(Request $request, PaymentMethod $paymentMethod, PaymentMethodBank $bank): RedirectResponse
    {
        abort_unless(Gate::allows('payment_method.edit'), 403);

        // Ensure bank belongs to this payment method
        abort_unless($bank->payment_method_id === $paymentMethod->id, 404);

        $data = $request->validate([
            'bank_name'      => 'required|string|max:100',
            'account_number' => 'nullable|string|max:100',
            'account_name'   => 'nullable|string|max:100',
            'charge_enabled' => 'boolean',
            'charge_type'    => 'nullable|in:percent,fixed',
            'charge_value'   => 'nullable|numeric|min:0|max:99999.99',
            'charge_label'   => 'nullable|string|max:100',
            'is_active'      => 'boolean',
            'sort_order'     => 'integer|min:0',
        ]);

        if (! empty($data['charge_enabled']) && empty($data['charge_type'])) {
            return back()->withErrors([
                'charge_type' => 'Charge type is required when charge is enabled.',
            ]);
        }

        $bank->update($data);

        ActivityLogService::log(
            'payment_method_bank',
            'updated',
            "Bank updated: {$bank->bank_name} under {$paymentMethod->name}",
            $bank,
            $data
        );

        return back()->with('success', 'Bank updated successfully.');
    }

    public function destroy(PaymentMethod $paymentMethod, PaymentMethodBank $bank): RedirectResponse
    {
        abort_unless(Gate::allows('payment_method.edit'), 403);

        abort_unless($bank->payment_method_id === $paymentMethod->id, 404);

        ActivityLogService::log(
            'payment_method_bank',
            'deleted',
            "Bank deleted: {$bank->bank_name} under {$paymentMethod->name}",
            $bank,
            ['bank_name' => $bank->bank_name]
        );

        $bank->delete();

        return back()->with('success', 'Bank deleted successfully.');
    }
}
