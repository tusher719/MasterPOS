<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAuthController extends Controller
{
    /**
     * Show customer login page.
     */
    public function showLogin(): Response|RedirectResponse
    {
        if (Auth::guard('customer')->check()) {
            return redirect()->route('customer.orders');
        }

        $settings = SettingsService::all();

        return Inertia::render('Customer/Login', [
            'settings' => [
                'business_name'   => $settings['business_name'] ?? 'Master Business Suite',
                'currency_symbol' => $settings['currency_symbol'] ?? '৳',
            ],
        ]);
    }

    /**
     * Handle customer login via phone or email.
     */
    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'login'    => ['required', 'string'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $login = trim($credentials['login']);
        $password = $credentials['password'];
        $remember = (bool) ($credentials['remember'] ?? false);

        // Find customer by phone or email
        $customer = Customer::where('phone', $login)
            ->orWhere('email', $login)
            ->first();

        if (! $customer || ! $customer->password || ! Hash::check($password, $customer->password)) {
            throw ValidationException::withMessages([
                'login' => ['These credentials do not match our records.'],
            ]);
        }

        if (! $customer->is_active) {
            throw ValidationException::withMessages([
                'login' => ['Your customer account has been deactivated. Please contact support.'],
            ]);
        }

        Auth::guard('customer')->login($customer, $remember);
        $request->session()->regenerate();

        return redirect()->intended(route('customer.orders'))
            ->with('success', "Welcome back, {$customer->name}!");
    }

    /**
     * Show customer registration page.
     */
    public function showRegister(): Response|RedirectResponse
    {
        if (Auth::guard('customer')->check()) {
            return redirect()->route('customer.orders');
        }

        $settings = SettingsService::all();

        return Inertia::render('Customer/Register', [
            'settings' => [
                'business_name'   => $settings['business_name'] ?? 'Master Business Suite',
                'currency_symbol' => $settings['currency_symbol'] ?? '৳',
            ],
        ]);
    }

    /**
     * Handle customer registration or activate existing guest record.
     */
    public function register(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:150'],
            'phone'    => ['required', 'string', 'max:30'],
            'email'    => ['nullable', 'email', 'max:150'],
            'address'  => ['nullable', 'string', 'max:500'],
            'city'     => ['nullable', 'string', 'max:100'],
            'password' => ['required', 'confirmed', Password::min(6)],
        ]);

        $phone = trim($validated['phone']);

        // Check if a customer record already exists for this phone (e.g., from POS or guest checkout)
        $existingCustomer = Customer::where('phone', $phone)->first();

        if ($existingCustomer) {
            // If they already set a password, they should log in
            if ($existingCustomer->password) {
                throw ValidationException::withMessages([
                    'phone' => ['An account with this phone already exists. Please log in instead.'],
                ]);
            }

            // Otherwise activate their existing record with their chosen password!
            $existingCustomer->update([
                'name'     => $validated['name'],
                'email'    => $validated['email'] ?? $existingCustomer->email,
                'address'  => $validated['address'] ?? $existingCustomer->address,
                'city'     => $validated['city'] ?? $existingCustomer->city,
                'password' => Hash::make($validated['password']),
            ]);

            $customer = $existingCustomer;
        } else {
            // Create brand new customer
            $customer = Customer::create([
                'name'      => $validated['name'],
                'phone'     => $phone,
                'email'     => $validated['email'] ?? null,
                'address'   => $validated['address'] ?? null,
                'city'      => $validated['city'] ?? 'Dhaka',
                'password'  => Hash::make($validated['password']),
                'is_active' => true,
            ]);
        }

        Auth::guard('customer')->login($customer, true);
        $request->session()->regenerate();

        return redirect()->route('customer.orders')
            ->with('success', 'Your account has been created successfully!');
    }

    /**
     * Log out customer.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('customer')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('public.home')
            ->with('success', 'You have been logged out.');
    }
}
