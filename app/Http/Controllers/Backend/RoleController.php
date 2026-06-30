<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    use AuthorizesRequests;
    public function index()
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::with('permissions')->get();
        $permissions = Permission::all()->groupBy(function ($p) {
            return explode('.', $p->name)[0];
        });

        return Inertia::render('Backend/Roles/Index', [
            'roles' => $roles,
            'permissionGroups' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Role::class);

        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
        ]);

        $role = Role::create(['name' => $request->name, 'guard_name' => 'web']);

        ActivityLogService::log('roles', 'created', "Role {$role->name} created", $role);

        return back()->with('success', 'Role created successfully');
    }

    public function updatePermissions(Request $request, Role $role)
{
    $this->authorize('edit', Role::class);

    $validated = $request->validate([
        'permissions' => 'nullable|array',
        'permissions.*' => 'string|exists:permissions,name',
    ]);

    $role->syncPermissions($validated['permissions'] ?? []);

    ActivityLogService::log('roles', 'updated', "Permissions updated for role {$role->name}", $role);

    return back()->with('success', 'Permissions updated successfully');
}

    public function destroy(Role $role)
    {
        $this->authorize('delete', Role::class);

        if (in_array($role->name, ['Admin'])) {
            return back()->with('error', 'এই Role ডিলিট করা যাবে না');
        }

        $role->delete();

        ActivityLogService::log('roles', 'deleted', "Role {$role->name} deleted", $role);

        return back()->with('success', 'Role deleted successfully');
    }
}
