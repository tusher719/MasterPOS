<?php

namespace Tests\Feature\Backend;

use App\Models\Customer;
use App\Models\HoldOrder;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PosManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $unauthorizedUser;
    protected Customer $customer;
    protected Product $product;
    protected PaymentMethod $paymentMethod;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Staff']);

        $this->admin = User::factory()->create(['status' => 'active']);
        $this->admin->assignRole('Admin');

        $this->unauthorizedUser = User::factory()->create(['status' => 'active']);

        $this->customer = Customer::create([
            'name'            => 'Test Pos Customer',
            'phone'           => '01711998877',
            'email'           => 'pos.customer@example.com',
            'opening_balance' => 0.00,
            'is_active'       => true,
        ]);

        $unit = Unit::firstOrCreate(['short_code' => 'pcs'], ['name' => 'Pieces', 'is_active' => true]);

        $this->product = Product::create([
            'name'                => 'Pos Barcode Scanner',
            'sku'                 => 'POS-SCN-01',
            'barcode'             => '123456789012',
            'unit_id'             => $unit->id,
            'cost_price'          => 2000.00,
            'sale_price'          => 3500.00,
            'stock_qty'           => 50,
            'low_stock_threshold' => 5,
            'is_active'           => true,
        ]);

        $this->paymentMethod = PaymentMethod::firstOrCreate(
            ['name' => 'Cash in Hand'],
            ['type' => 'cash', 'is_active' => true]
        );
    }

    public function test_admin_can_view_pos_terminal(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.pos.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_complete_pos_sale_and_receive_json_with_uuid(): void
    {
        $initialStock = (float) $this->product->stock_qty;

        $payload = [
            'customer_id'       => $this->customer->id,
            'sale_date'         => Carbon::now()->toDateString(),
            'payment_type'      => 'full_paid',
            'payment_method_id' => $this->paymentMethod->id,
            'paid_amount'       => 7000.00,
            'discount'          => 0.00,
            'tax'               => 0.00,
            'items'             => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 2,
                    'unit_price' => 3500.00,
                    'discount'   => 0.00,
                ],
            ],
            'note'              => 'POS Checkout Automated Test',
        ];

        $response = $this->actingAs($this->admin)->postJson(route('backend.pos.sales.store'), $payload);
        $response->assertStatus(200);
        $response->assertJsonStructure(['id', 'uuid', 'reference_no']);

        $saleId = $response->json('id');
        $sale = Sale::find($saleId);
        $this->assertNotNull($sale);
        $this->assertNotNull($sale->uuid);
        $this->assertEquals(7000.00, (float) $sale->grand_total);
        $this->assertEquals('paid', $sale->payment_status);

        // Verify stock decrement
        $this->product->refresh();
        $this->assertEquals($initialStock - 2, (float) $this->product->stock_qty);
    }

    public function test_pos_sale_with_resumed_hold_order_atomically_deletes_hold_order(): void
    {
        $holdOrder = HoldOrder::create([
            'reference_no' => 'HOLD-TEST-' . time(),
            'customer_id'  => $this->customer->id,
            'status'       => 'processing',
            'subtotal'     => 3500.00,
            'grand_total'  => 3500.00,
            'created_by'   => $this->admin->id,
        ]);

        $payload = [
            'customer_id'       => $this->customer->id,
            'hold_order_id'     => $holdOrder->id,
            'sale_date'         => Carbon::now()->toDateString(),
            'payment_type'      => 'full_paid',
            'payment_method_id' => $this->paymentMethod->id,
            'paid_amount'       => 3500.00,
            'items'             => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                    'unit_price' => 3500.00,
                    'discount'   => 0.00,
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->postJson(route('backend.pos.sales.store'), $payload);
        $response->assertStatus(200);

        // Hold order must be deleted
        $this->assertDatabaseMissing('hold_orders', ['id' => $holdOrder->id]);
    }

    public function test_unauthorized_user_cannot_access_pos(): void
    {
        $response = $this->actingAs($this->unauthorizedUser)->get(route('backend.pos.index'));
        $response->assertStatus(403);
    }
}
