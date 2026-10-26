<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Load roles and all permissions (direct + via roles)
        $userRoles = $user->getRoleNames()->values()->all();
        $allPermissions = $user->getAllPermissions()->pluck('name')->sort()->values()->all();

        // Group permissions by module
        $permissionsByModule = [];
        foreach ($allPermissions as $perm) {
            $parts = explode('.', $perm, 2);
            $module = count($parts) > 1 ? ucfirst($parts[0]) : 'General';
            $permissionsByModule[$module][] = $perm;
        }

        // Recent 10 login histories
        $loginHistories = $user->loginHistories()
            ->latest('logged_in_at')
            ->take(10)
            ->get()
            ->map(fn($lh) => [
                'id' => $lh->id,
                'ip_address' => $lh->ip_address,
                'user_agent' => $lh->user_agent,
                'logged_in_at' => $lh->logged_in_at?->toIso8601String(),
            ]);

        // Staff Directory
        $staffUsers = \App\Models\User::with('roles')
            ->orderBy('name')
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'status' => $u->status ?? 'active',
                'roles' => $u->getRoleNames()->values()->all(),
                'last_seen_at' => $u->last_seen_at?->toIso8601String(),
                'created_at' => $u->created_at?->toIso8601String(),
            ]);

        // Customer Directory Preview
        $customers = \App\Models\Customer::withCount('sales')
            ->latest()
            ->take(25)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'phone' => $c->phone,
                'email' => $c->email,
                'city' => $c->city,
                'is_active' => (bool)$c->is_active,
                'sales_count' => $c->sales_count,
                'opening_balance' => (float)$c->opening_balance,
                'created_at' => $c->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status ?? 'active',
                'avatar' => $user->avatar,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'created_at' => $user->created_at?->toIso8601String(),
                'roles' => $userRoles,
                'all_permissions' => $allPermissions,
                'permissions_by_module' => $permissionsByModule,
                'login_histories' => $loginHistories,
            ],
            'staffUsers' => $staffUsers,
            'customers' => $customers,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
