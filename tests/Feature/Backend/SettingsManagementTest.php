<?php

namespace Tests\Feature\Backend;

use App\Models\BusinessSetting;
use App\Models\ExpenseCategory;
use App\Models\InvestmentType;
use App\Models\PaymentMethod;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\Step03PermissionSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class SettingsManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->seed(Step03PermissionSeeder::class);

        $this->admin = User::factory()->create([
            'email' => 'admin_settings_' . uniqid() . '@example.com',
        ]);
        $this->admin->assignRole('Admin');

        $this->staff = User::factory()->create([
            'email' => 'staff_settings_' . uniqid() . '@example.com',
        ]);
        $this->staff->assignRole('Staff');
    }

    public function test_admin_can_view_settings_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.settings.index'));

        $response->assertOk();
    }

    public function test_admin_can_update_business_settings(): void
    {
        $response = $this->actingAs($this->admin)->post(route('backend.settings.update'), [
            'group'         => 'business',
            'business_name' => 'Master Retail Store',
            'business_email'=> 'store@masterpos.test',
        ]);

        $response->assertRedirect();
        $this->assertEquals('Master Retail Store', BusinessSetting::get('business_name'));
        $this->assertEquals('store@masterpos.test', BusinessSetting::get('business_email'));
    }

    public function test_admin_can_view_payment_methods(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.payment-methods.index'));

        $response->assertOk();
    }

    public function test_admin_can_create_payment_method(): void
    {
        $pmName = 'Nagad_' . uniqid();

        $response = $this->actingAs($this->admin)->post(route('backend.payment-methods.store'), [
            'name'                => $pmName,
            'type'                => 'mobile_banking',
            'is_active'           => true,
            'sort_order'          => 1,
            'charge_enabled'      => false,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('payment_methods', ['name' => $pmName, 'type' => 'mobile_banking']);
    }

    public function test_admin_can_update_payment_method(): void
    {
        $pm = PaymentMethod::create([
            'name'           => 'Bkash_' . uniqid(),
            'type'           => 'mobile_banking',
            'is_active'      => true,
            'sort_order'     => 1,
            'charge_enabled' => false,
        ]);

        $response = $this->actingAs($this->admin)->put(route('backend.payment-methods.update', $pm->id), [
            'name'                => 'Bkash Updated',
            'type'                => 'mobile_banking',
            'is_active'           => true,
            'sort_order'          => 2,
            'charge_enabled'      => true,
            'online_charge_type'  => 'percent',
            'online_charge_value' => 1.5,
            'charge_label'        => 'Bkash Fee 1.5%',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('payment_methods', [
            'id'                  => $pm->id,
            'name'                => 'Bkash Updated',
            'charge_enabled'      => 1,
            'online_charge_type'  => 'percent',
        ]);
    }

    public function test_admin_can_delete_payment_method(): void
    {
        $pm = PaymentMethod::create([
            'name'           => 'TempPM_' . uniqid(),
            'type'           => 'other',
            'is_active'      => true,
            'sort_order'     => 99,
            'charge_enabled' => false,
        ]);

        $response = $this->actingAs($this->admin)->delete(route('backend.payment-methods.destroy', $pm->id));

        $response->assertRedirect();
        $this->assertSoftDeleted($pm);
    }

    public function test_admin_can_create_expense_category(): void
    {
        $catName = 'Utilities_' . uniqid();

        $response = $this->actingAs($this->admin)->post(route('backend.expense-categories.store'), [
            'name'        => $catName,
            'description' => 'Office electricity and water bills',
            'color'       => '#ef4444',
            'is_active'   => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('expense_categories', ['name' => $catName, 'color' => '#ef4444']);
    }

    public function test_admin_can_create_investment_type(): void
    {
        $typeName = 'Direct Equity_' . uniqid();

        $response = $this->actingAs($this->admin)->post(route('backend.investment-types.store'), [
            'name'        => $typeName,
            'description' => 'Direct equity capital injection',
            'is_active'   => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('investment_types', ['name' => $typeName]);
    }

    public function test_user_without_permission_cannot_access_settings(): void
    {
        $unauthorizedUser = User::factory()->create();
        $response = $this->actingAs($unauthorizedUser)->get(route('backend.settings.index'));

        $response->assertForbidden();
    }

    public function test_staff_without_edit_permission_cannot_update_settings(): void
    {
        $response = $this->actingAs($this->staff)->post(route('backend.settings.update'), [
            'group'             => 'currency',
            'business_currency' => 'EUR',
            'currency_symbol'   => '€',
            'currency_position' => 'before',
            'decimal_places'    => 2,
        ]);

        $response->assertForbidden();
    }
}
