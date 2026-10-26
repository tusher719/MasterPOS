<?php

namespace Tests\Feature\Backend;

use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CouponManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $unauthorizedUser;
    protected Customer $customer;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Staff']);

        $this->admin = User::factory()->create(['status' => 'active']);
        $this->admin->assignRole('Admin');

        $this->unauthorizedUser = User::factory()->create(['status' => 'active']);

        $this->customer = Customer::firstOrCreate(
            ['phone' => '01711223344'],
            ['name' => 'Test Customer', 'email' => 'customer@example.com']
        );

        $category = ProductCategory::firstOrCreate(['name' => 'General Electronics', 'slug' => 'gen-elec']);
        $this->product = Product::firstOrCreate(
            ['sku' => 'TEST-CPN-01'],
            [
                'name'          => 'Test Coupon Product',
                'category_id'   => $category->id,
                'cost_price'    => 100,
                'sale_price'    => 500,
                'stock_qty'     => 50,
                'is_active'     => true,
            ]
        );
    }

    public function test_admin_can_view_coupons_index_with_stats(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.coupons.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backend/Coupons/Index')
            ->has('coupons')
            ->has('stats')
        );
    }

    public function test_admin_can_create_percentage_and_fixed_coupons(): void
    {
        $payload = [
            'code'                      => 'SAVE20',
            'description'               => '20% discount on orders over 1000',
            'type'                      => 'percent',
            'value'                     => 20.00,
            'applicable_to'             => 'all',
            'min_order_amount'          => 1000.00,
            'max_discount_amount'       => 500.00,
            'usage_limit'               => 100,
            'usage_limit_per_customer'  => 1,
            'starts_at'                 => now()->subDay()->toDateString(),
            'expires_at'                => now()->addDays(30)->toDateString(),
            'is_active'                 => true,
        ];

        $response = $this->actingAs($this->admin)->post(route('backend.coupons.store'), $payload);
        $response->assertRedirect();

        $coupon = Coupon::where('code', 'SAVE20')->first();
        $this->assertNotNull($coupon);
        $this->assertNotNull($coupon->uuid);
        $this->assertEquals('percent', $coupon->type);
        $this->assertEquals(20.00, (float) $coupon->value);
        $this->assertEquals(1000.00, (float) $coupon->min_order_amount);
    }

    public function test_admin_can_update_coupon(): void
    {
        $coupon = Coupon::create([
            'code'             => 'UPDATE10',
            'description'      => 'Initial promo',
            'type'             => 'fixed',
            'value'            => 100.00,
            'applicable_to'    => 'all',
            'min_order_amount' => 500.00,
            'is_active'        => true,
        ]);

        $payload = [
            'code'             => 'UPDATE10',
            'description'      => 'Updated promo description',
            'type'             => 'fixed',
            'value'            => 150.00,
            'applicable_to'    => 'all',
            'min_order_amount' => 600.00,
            'is_active'        => true,
        ];

        $response = $this->actingAs($this->admin)->put(route('backend.coupons.update', $coupon), $payload);
        $response->assertRedirect();

        $coupon->refresh();
        $this->assertEquals(150.00, (float) $coupon->value);
        $this->assertEquals('Updated promo description', $coupon->description);
    }

    public function test_admin_can_toggle_coupon_status(): void
    {
        $coupon = Coupon::create([
            'code'          => 'TOGGLE10',
            'type'          => 'fixed',
            'value'         => 50.00,
            'applicable_to' => 'all',
            'is_active'     => true,
        ]);

        $response = $this->actingAs($this->admin)->patch(route('backend.coupons.toggle-status', $coupon));
        $response->assertRedirect();

        $coupon->refresh();
        $this->assertFalse((bool) $coupon->is_active);

        // Toggle back
        $this->actingAs($this->admin)->patch(route('backend.coupons.toggle-status', $coupon));
        $coupon->refresh();
        $this->assertTrue((bool) $coupon->is_active);
    }

    public function test_admin_can_soft_delete_and_restore_coupon(): void
    {
        $coupon = Coupon::create([
            'code'          => 'DELETE10',
            'type'          => 'fixed',
            'value'         => 50.00,
            'applicable_to' => 'all',
            'is_active'     => true,
        ]);

        // Soft delete
        $response = $this->actingAs($this->admin)->delete(route('backend.coupons.destroy', $coupon));
        $response->assertRedirect();
        $this->assertSoftDeleted('coupons', ['id' => $coupon->id]);

        // Restore
        $restoreResponse = $this->actingAs($this->admin)->post(route('backend.coupons.restore', $coupon->id));
        $restoreResponse->assertRedirect();
        $this->assertNotSoftDeleted('coupons', ['id' => $coupon->id]);
    }

    public function test_unauthorized_user_cannot_create_coupons(): void
    {
        $payload = [
            'code'          => 'UNAUTH10',
            'type'          => 'fixed',
            'value'         => 50.00,
            'applicable_to' => 'all',
        ];

        $response = $this->actingAs($this->unauthorizedUser)->post(route('backend.coupons.store'), $payload);
        $response->assertStatus(403);
    }

    public function test_coupon_validation_service_and_endpoint(): void
    {
        $coupon = Coupon::create([
            'code'                     => 'VALIDATE20',
            'type'                     => 'percent',
            'value'                    => 20.00,
            'applicable_to'            => 'all',
            'min_order_amount'         => 1000.00,
            'max_discount_amount'      => 300.00,
            'usage_limit'              => 5,
            'usage_limit_per_customer' => 1,
            'is_active'                => true,
        ]);

        // Below minimum order amount -> invalid
        $resLow = $this->actingAs($this->admin)->postJson(route('backend.pos.coupons.validate'), [
            'code'        => 'VALIDATE20',
            'subtotal'    => 800.00,
            'customer_id' => $this->customer->id,
        ]);
        $resLow->assertJson([
            'valid' => false,
        ]);

        // Meets minimum order amount (1500) -> 20% is 300 (hits max discount 300)
        $resValid = $this->actingAs($this->admin)->postJson(route('backend.pos.coupons.validate'), [
            'code'        => 'VALIDATE20',
            'subtotal'    => 1500.00,
            'customer_id' => $this->customer->id,
        ]);
        $resValid->assertJson([
            'valid'           => true,
            'discount_amount' => 300.00,
        ]);
    }

    public function test_pos_sale_applies_coupon_and_records_usage(): void
    {
        $coupon = Coupon::create([
            'code'                     => 'POSDISC100',
            'type'                     => 'fixed',
            'value'                    => 100.00,
            'applicable_to'            => 'all',
            'min_order_amount'         => 300.00,
            'usage_limit'              => 10,
            'usage_limit_per_customer' => 2,
            'is_active'                => true,
        ]);

        $pm = PaymentMethod::firstOrCreate(
            ['name' => 'Cash'],
            ['type' => 'cash', 'is_active' => true]
        );

        $payload = [
            'customer_id'       => $this->customer->id,
            'payment_method_id' => $pm->id,
            'sale_date'         => today()->toDateString(),
            'coupon_code'       => 'POSDISC100',
            'coupon_discount'   => 100.00,
            'discount'          => 0,
            'tax'               => 0,
            'delivery_charge'   => 0,
            'paid_amount'       => 400.00, // 500 subtotal - 100 coupon = 400 grand total
            'change_amount'     => 0,
            'sale_type'         => 'counter',
            'payment_status'    => 'paid',
            'items'             => [
                [
                    'product_id' => $this->product->id,
                    'variant_id' => null,
                    'quantity'   => 1,
                    'unit_price' => 500.00,
                    'discount'   => 0,
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->post(route('backend.pos.sales.store'), $payload);
        $response->assertStatus(200);

        // Check Sale recorded coupon
        $sale = Sale::where('customer_id', $this->customer->id)->latest('id')->first();
        $this->assertNotNull($sale);
        $this->assertEquals('POSDISC100', $sale->coupon_code);
        $this->assertEquals(100.00, (float) $sale->coupon_discount);
        $this->assertEquals(400.00, (float) $sale->grand_total);

        // Check Coupon Usage recorded
        $usage = CouponUsage::where('coupon_id', $coupon->id)->where('sale_id', $sale->id)->first();
        $this->assertNotNull($usage);
        $this->assertEquals(100.00, (float) $usage->discount_amount);
        $this->assertEquals($this->customer->id, $usage->customer_id);

        // Coupon used_count incremented
        $coupon->refresh();
        $this->assertEquals(1, $coupon->used_count);
    }

    public function test_public_checkout_validates_and_stores_coupon_usage(): void
    {
        $coupon = Coupon::create([
            'code'                     => 'GUEST50',
            'type'                     => 'fixed',
            'value'                    => 50.00,
            'applicable_to'            => 'all',
            'min_order_amount'         => 200.00,
            'usage_limit'              => 50,
            'usage_limit_per_customer' => 1,
            'is_active'                => true,
        ]);

        // Public validation endpoint
        $valRes = $this->postJson(route('public.checkout.coupon.validate'), [
            'code'           => 'GUEST50',
            'subtotal'       => 500.00,
            'customer_phone' => '01899887766',
        ]);
        $valRes->assertJson([
            'valid'           => true,
            'discount_amount' => 50.00,
        ]);

        // Place guest order
        $orderPayload = [
            'customer_name'    => 'Guest Shopper',
            'customer_phone'   => '01899887766',
            'customer_email'   => 'shopper@example.com',
            'coupon_code'      => 'GUEST50',
            'delivery_type'    => 'inside_dhaka',
            'delivery_address' => 'Mirpur 10, Dhaka',
            'payment_type'     => 'cash_on_delivery',
            'items'            => [
                [
                    'id'  => $this->product->id,
                    'qty' => 1,
                ],
            ],
        ];

        $orderRes = $this->post(route('public.checkout.store'), $orderPayload);
        $orderRes->assertRedirect();

        $guestCustomer = Customer::where('phone', '01899887766')->first();
        $this->assertNotNull($guestCustomer);

        $sale = Sale::where('customer_id', $guestCustomer->id)->latest('id')->first();
        $this->assertNotNull($sale);
        $this->assertEquals('GUEST50', $sale->coupon_code);
        $this->assertEquals(50.00, (float) $sale->coupon_discount);

        $usage = CouponUsage::where('coupon_id', $coupon->id)->where('customer_phone', '01899887766')->first();
        $this->assertNotNull($usage);
    }
}
