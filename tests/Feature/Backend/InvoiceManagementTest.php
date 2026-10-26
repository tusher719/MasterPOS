<?php

namespace Tests\Feature\Backend;

use App\Models\Customer;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InvoiceManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $unauthorizedUser;
    protected Sale $sale;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Staff']);

        $this->admin = User::factory()->create(['status' => 'active']);
        $this->admin->assignRole('Admin');

        $this->unauthorizedUser = User::factory()->create(['status' => 'active']);

        $customer = Customer::create([
            'name'      => 'Invoicing Test Customer',
            'email'     => 'invoice.customer@test.com',
            'phone'     => '+8801700998877',
            'address'   => 'Dhanmondi, Dhaka',
            'is_active' => true,
        ]);

        $this->sale = Sale::create([
            'reference_no'    => 'INV-TEST-001',
            'customer_id'     => $customer->id,
            'sale_date'       => now()->toDateString(),
            'subtotal'        => 5000.00,
            'tax_amount'      => 250.00,
            'discount_amount' => 100.00,
            'shipping_amount' => 50.00,
            'grand_total'     => 5200.00,
            'paid_amount'     => 5200.00,
            'due_amount'      => 0.00,
            'payment_status'  => 'paid',
            'sale_status'     => 'completed',
            'delivery_type'   => 'store_pickup',
            'created_by'      => $this->admin->id,
        ]);
    }

    public function test_admin_can_view_invoices_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.invoices.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_filter_invoices_by_payment_status(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.invoices.index', [
            'payment_status' => 'paid',
        ]));
        $response->assertStatus(200);
    }

    public function test_admin_can_view_single_invoice(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.invoices.show', $this->sale));
        $response->assertStatus(200);
    }

    public function test_admin_can_download_invoice_pdf(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.invoices.pdf', $this->sale));
        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_unauthorized_user_cannot_view_invoices(): void
    {
        $response = $this->actingAs($this->unauthorizedUser)->get(route('backend.invoices.index'));
        $response->assertStatus(403);
    }
}
