<?php

namespace Tests\Feature\Backend;

use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SupplierManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $unauthorizedUser;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Staff']);

        $this->admin = User::factory()->create(['status' => 'active']);
        $this->admin->assignRole('Admin');

        $this->unauthorizedUser = User::factory()->create(['status' => 'active']);
    }

    public function test_admin_can_view_suppliers_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.suppliers.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_create_supplier_with_uuid(): void
    {
        $payload = [
            'name'            => 'Apex Hardware Ltd',
            'company'         => 'Apex Group',
            'email'           => 'apex.hardware@example.com',
            'phone'           => '+8801700112233',
            'address'         => 'Gulshan 1, Dhaka',
            'city'            => 'Dhaka',
            'country'         => 'Bangladesh',
            'opening_balance' => 5000.00,
            'is_active'       => true,
        ];

        $response = $this->actingAs($this->admin)->post(route('backend.suppliers.store'), $payload);
        $response->assertRedirect();

        $supplier = Supplier::where('email', 'apex.hardware@example.com')->first();
        $this->assertNotNull($supplier);
        $this->assertNotNull($supplier->uuid);
        $this->assertEquals('Apex Hardware Ltd', $supplier->name);
    }

    public function test_admin_can_update_supplier(): void
    {
        $supplier = Supplier::create([
            'name'            => 'Original Supplier',
            'company'         => 'Original Co',
            'email'           => 'orig.supplier@example.com',
            'phone'           => '+8801700000001',
            'opening_balance' => 0.00,
            'is_active'       => true,
        ]);

        $payload = [
            'name'            => 'Updated Supplier Name',
            'company'         => 'Updated Co',
            'email'           => $supplier->email,
            'phone'           => $supplier->phone,
            'opening_balance' => 1000.00,
            'is_active'       => true,
        ];

        $response = $this->actingAs($this->admin)->put(route('backend.suppliers.update', $supplier), $payload);
        $response->assertRedirect();

        $supplier->refresh();
        $this->assertEquals('Updated Supplier Name', $supplier->name);
    }

    public function test_admin_can_soft_delete_supplier(): void
    {
        $supplier = Supplier::create([
            'name'            => 'Supplier To Delete',
            'company'         => 'Delete Co',
            'email'           => 'delete.supplier@example.com',
            'phone'           => '+8801700000002',
            'opening_balance' => 0.00,
            'is_active'       => true,
        ]);

        $response = $this->actingAs($this->admin)->delete(route('backend.suppliers.destroy', $supplier));
        $response->assertRedirect();

        $this->assertSoftDeleted('suppliers', ['id' => $supplier->id]);
    }

    public function test_admin_can_restore_soft_deleted_supplier(): void
    {
        $supplier = Supplier::create([
            'name'            => 'Supplier To Restore',
            'company'         => 'Restore Co',
            'email'           => 'restore.supplier@example.com',
            'phone'           => '+8801700000003',
            'opening_balance' => 0.00,
            'is_active'       => true,
        ]);
        $supplier->delete();
        $this->assertSoftDeleted('suppliers', ['id' => $supplier->id]);

        $response = $this->actingAs($this->admin)->post(route('backend.suppliers.restore', $supplier->id));
        $response->assertRedirect();

        $this->assertNotSoftDeleted('suppliers', ['id' => $supplier->id]);
    }

    public function test_unauthorized_user_cannot_access_suppliers(): void
    {
        $response = $this->actingAs($this->unauthorizedUser)->get(route('backend.suppliers.index'));
        $response->assertStatus(403);
    }
}
