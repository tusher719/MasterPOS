<?php

namespace Tests\Feature\Backend;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);

        $this->admin = User::factory()->create([
            'email' => 'admin_test_' . uniqid() . '@example.com',
        ]);
        $this->admin->assignRole('Admin');

        $this->staff = User::factory()->create([
            'email' => 'staff_test_' . uniqid() . '@example.com',
        ]);
        $this->staff->assignRole('Staff');
    }

    public function test_admin_can_view_users_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.users.index'));

        $response->assertOk();
    }

    public function test_admin_can_create_user(): void
    {
        $email = 'newuser_' . uniqid() . '@example.com';

        $response = $this->actingAs($this->admin)->post(route('backend.users.store'), [
            'name'     => 'New Auditor User',
            'email'    => $email,
            'phone'    => '01700' . rand(100000, 999999),
            'password' => 'password123',
            'role'     => 'Staff',
            'status'   => 'active',
        ]);

        $response->assertRedirect(route('backend.users.index'));
        $this->assertDatabaseHas('users', ['email' => $email, 'name' => 'New Auditor User']);

        $created = User::where('email', $email)->first();
        $this->assertTrue($created->hasRole('Staff'));
    }

    public function test_admin_can_update_user(): void
    {
        $targetUser = User::factory()->create([
            'name'   => 'Original Name',
            'status' => 'active',
        ]);
        $targetUser->assignRole('Staff');

        $response = $this->actingAs($this->admin)->put(route('backend.users.update', $targetUser->id), [
            'name'   => 'Updated Name',
            'email'  => $targetUser->email,
            'phone'  => '01900' . rand(100000, 999999),
            'status' => 'inactive',
            'role'   => 'Admin',
        ]);

        $response->assertRedirect(route('backend.users.index'));
        $this->assertDatabaseHas('users', [
            'id'     => $targetUser->id,
            'name'   => 'Updated Name',
            'status' => 'inactive',
        ]);
        $this->assertTrue($targetUser->fresh()->hasRole('Admin'));
    }

    public function test_admin_can_archive_user(): void
    {
        $targetUser = User::factory()->create();

        $response = $this->actingAs($this->admin)->delete(route('backend.users.destroy', $targetUser->id));

        $response->assertRedirect();
        $this->assertSoftDeleted($targetUser);
    }

    public function test_staff_without_permission_cannot_view_users(): void
    {
        // Staff by default has no users.view permission
        $response = $this->actingAs($this->staff)->get(route('backend.users.index'));

        $response->assertForbidden();
    }

    public function test_admin_can_view_login_histories(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.login-histories.index'));

        $response->assertOk();
    }

    public function test_admin_can_view_activity_logs(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.activity-logs.index'));

        $response->assertOk();
    }
}
