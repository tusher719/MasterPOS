<?php

namespace Tests\Feature\Public;

use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StorefrontCheckoutTest extends TestCase
{
    use DatabaseTransactions;

    private User $admin;
    private ProductCategory $category;
    private Unit $unit;
    private Product $product;
    private PaymentMethod $paymentMethod;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $this->admin = User::firstOrCreate(
            ['email' => 'admin_test@masterpos.local'],
            ['name' => 'Admin Test', 'password' => bcrypt('password')]
        );
        if (! $this->admin->hasRole('Admin')) {
            $this->admin->assignRole($role);
        }

        $this->category = ProductCategory::firstOrCreate(
            ['slug' => 'test-gadgets'],
            ['name' => 'Test Gadgets', 'status' => 'active']
        );

        $this->unit = Unit::firstOrCreate(
            ['name' => 'Piece'],
            ['short_code' => 'pc', 'status' => 'active']
        );

        $this->product = Product::create([
            'name'                => 'Wireless Mouse ' . uniqid(),
            'slug'                => 'wireless-mouse-' . uniqid(),
            'sku'                 => 'WM-' . rand(1000, 9999),
            'category_id'         => $this->category->id,
            'unit_id'             => $this->unit->id,
            'cost_price'          => 300,
            'sale_price'          => 500,
            'stock_qty'           => 15,
            'low_stock_threshold' => 3,
            'status'              => 'active',
            'created_by'          => $this->admin->id,
        ]);

        $this->paymentMethod = PaymentMethod::firstOrCreate(
            ['name' => 'bKash'],
            ['type' => 'mobile_banking', 'is_active' => true]
        );
    }

    public function test_guest_can_view_storefront_home_and_products(): void
    {
        $this->get(route('public.home'))->assertStatus(200);
        $this->get(route('public.products.index'))->assertStatus(200);
        $this->get(route('public.products.show', $this->product->slug))->assertStatus(200);
    }

    public function test_guest_can_view_checkout_page(): void
    {
        $response = $this->get(route('public.checkout.index'));
        $response->assertStatus(200);
    }

    public function test_guest_cannot_checkout_with_empty_data(): void
    {
        $response = $this->post(route('public.checkout.store'), []);
        $response->assertSessionHasErrors(['customer_name', 'customer_phone', 'delivery_type', 'payment_type', 'items']);
    }

    public function test_guest_can_place_cash_on_delivery_order_successfully(): void
    {
        $orderData = [
            'customer_name'    => 'Rahim Ahmed',
            'customer_phone'   => '01712345678',
            'customer_email'   => 'rahim@example.com',
            'delivery_type'    => 'inside_dhaka',
            'delivery_address' => 'House 12, Road 4, Dhanmondi, Dhaka',
            'payment_type'     => 'cash_on_delivery',
            'note'             => 'Please call before arrival',
            'items'            => [
                [
                    'id'  => $this->product->id,
                    'qty' => 3,
                ],
            ],
        ];

        $response = $this->post(route('public.checkout.store'), $orderData);

        $sale = Sale::where('delivery_contact_phone', '01712345678')->latest('id')->first();
        $this->assertNotNull($sale);
        $response->assertRedirect(route('public.order-confirmed', ['reference' => $sale->reference_no]));

        // Assert sale details
        $this->assertEquals('processing', $sale->order_status);
        $this->assertEquals('cash_on_delivery', $sale->payment_type);
        $this->assertEquals('due', $sale->payment_status);
        $this->assertEquals(1500.00, (float) $sale->subtotal);
        $this->assertEquals(60.00, (float) $sale->delivery_charge);
        $this->assertEquals(1560.00, (float) $sale->grand_total);
        $this->assertEquals(0.00, (float) $sale->paid_amount);
        $this->assertEquals(1560.00, (float) $sale->due_amount);

        // Assert customer was created
        $customer = Customer::where('phone', '01712345678')->first();
        $this->assertNotNull($customer);
        $this->assertEquals('Rahim Ahmed', $customer->name);
        $this->assertEquals($customer->id, $sale->customer_id);

        // Assert sale items
        $this->assertCount(1, $sale->items);
        $this->assertEquals(3, $sale->items->first()->quantity);
        $this->assertEquals(500.00, (float) $sale->items->first()->unit_price);

        // Assert atomic stock deduction
        $this->assertEquals(12, (int) $this->product->fresh()->stock_qty);

        // Assert stock movement logged
        $movement = StockMovement::where('product_id', $this->product->id)
            ->where('reference_id', $sale->id)
            ->first();
        $this->assertNotNull($movement);
        $this->assertEquals(-3, $movement->quantity);
        $this->assertEquals('sale', $movement->type);
    }

    public function test_guest_cannot_place_order_exceeding_available_stock(): void
    {
        $this->product->update(['stock_qty' => 2]);

        $orderData = [
            'customer_name'    => 'Karim Ullah',
            'customer_phone'   => '01812345678',
            'delivery_type'    => 'inside_dhaka',
            'delivery_address' => 'Mirpur 10, Dhaka',
            'payment_type'     => 'cash_on_delivery',
            'items'            => [
                [
                    'id'  => $this->product->id,
                    'qty' => 5, // Exceeds available stock (2)
                ],
            ],
        ];

        $response = $this->post(route('public.checkout.store'), $orderData);
        $response->assertSessionHasErrors('items');

        // Stock must remain unchanged
        $this->assertEquals(2, (int) $this->product->fresh()->stock_qty);
    }

    public function test_guest_can_view_order_confirmed_page(): void
    {
        $customer = Customer::create([
            'name'  => 'Jamal Khan',
            'phone' => '01999887766',
        ]);

        $sale = Sale::create([
            'reference_no'           => Sale::generateReference(),
            'customer_id'            => $customer->id,
            'sale_date'              => today(),
            'subtotal'               => 1000,
            'discount'               => 0,
            'tax'                    => 0,
            'grand_total'            => 1060,
            'paid_amount'            => 0,
            'due_amount'             => 1060,
            'payment_status'         => 'due',
            'order_status'           => 'processing',
            'payment_type'           => 'cash_on_delivery',
            'delivery_type'          => 'inside_dhaka',
            'delivery_charge'        => 60,
            'delivery_address'       => 'Uttara, Dhaka',
            'delivery_contact_phone' => '01999887766',
            'delivery_status'        => 'pending',
            'created_by'             => $this->admin->id,
        ]);

        $response = $this->get(route('public.order-confirmed', ['reference' => $sale->reference_no]));
        $response->assertStatus(200);
    }
}
