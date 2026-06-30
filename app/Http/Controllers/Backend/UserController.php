<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreUserRequest;
use App\Http\Requests\Backend\UpdateUserRequest;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    use AuthorizesRequests;
    public function index()
    {
        $this->authorize('viewAny', User::class);

        $users = User::with('roles')
            ->when(request('search'), fn($q) => $q->where('name', 'like', '%' . request('search') . '%'))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Backend/Users/Index', [
            'users' => $users,
            'filters' => request()->only('search'),
        ]);
    }

    public function create()
    {
        $this->authorize('create', User::class);

        return Inertia::render('Backend/Users/Create', [
            'roles' => Role::pluck('name'),
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => bcrypt($request->password),
            'status' => $request->status,
        ]);

        $user->assignRole($request->role);

        ActivityLogService::log('users', 'created', "User {$user->name} created", $user);

        return redirect()->route('backend.users.index')->with('success', 'User created successfully');
    }

    public function edit(User $user)
    {
        $this->authorize('update', $user);

        return Inertia::render('Backend/Users/Edit', [
            'user' => $user->load('roles'),
            'roles' => Role::pluck('name'),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'status' => $request->status,
            ...($request->password ? ['password' => bcrypt($request->password)] : []),
        ]);

        $user->syncRoles([$request->role]);

        ActivityLogService::log('users', 'updated', "User {$user->name} updated", $user);

        return redirect()->route('backend.users.index')->with('success', 'User updated successfully');
    }

    public function destroy(User $user)
    {
        $this->authorize('delete', $user);

        $user->delete();

        ActivityLogService::log('users', 'deleted', "User {$user->name} archived", $user);

        return back()->with('success', 'User archived successfully');
    }
}
