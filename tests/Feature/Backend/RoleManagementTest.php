<?php

namespace Tests\Feature\Backend;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);

        $this->admin = User::factory()->create([
            'email' => 'admin_role_' . uniqid() . '@example.com',
        ]);
        $this->admin->assignRole('Admin');

        $this->staff = User::factory()->create([
            'email' => 'staff_role_' . uniqid() . '@example.com',
        ]);
        $this->staff->assignRole('Staff');
    }

    public function test_admin_can_view_roles_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.roles.index'));

        $response->assertOk();
    }

    public function test_admin_can_create_new_role(): void
    {
        $roleName = 'Manager_' . uniqid();

        $response = $this->actingAs($this->admin)->post(route('backend.roles.store'), [
            'name' => $roleName,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('roles', ['name' => $roleName, 'guard_name' => 'web']);
    }

    public function test_admin_can_update_role_permissions(): void
    {
        $role = Role::firstOrCreate(['name' => 'Cashier_' . uniqid(), 'guard_name' => 'web']);
        $permission = Permission::firstOrCreate(['name' => 'pos.view', 'guard_name' => 'web']);

        $response = $this->actingAs($this->admin)->put(route('backend.roles.permissions', $role->id), [
            'permissions' => [$permission->name],
        ]);

        $response->assertRedirect();
        $this->assertTrue($role->fresh()->hasPermissionTo('pos.view'));
    }

    public function test_admin_cannot_delete_system_admin_role(): void
    {
        $adminRole = Role::where('name', 'Admin')->firstOrFail();

        $response = $this->actingAs($this->admin)->delete(route('backend.roles.destroy', $adminRole->id));

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('roles', ['name' => 'Admin']);
    }

    public function test_admin_can_delete_custom_role(): void
    {
        $role = Role::create(['name' => 'TempRole_' . uniqid(), 'guard_name' => 'web']);

        $response = $this->actingAs($this->admin)->delete(route('backend.roles.destroy', $role->id));

        $response->assertRedirect();
        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }

    public function test_staff_without_permission_cannot_access_roles(): void
    {
        $response = $this->actingAs($this->staff)->get(route('backend.roles.index'));

        $response->assertForbidden();
    }
}
