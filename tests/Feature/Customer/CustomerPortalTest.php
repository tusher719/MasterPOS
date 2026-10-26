<?php

namespace Tests\Feature\Customer;

use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CustomerPortalTest extends TestCase
{
    use DatabaseTransactions;

    private ProductCategory $category;
    private Unit $unit;
    private Product $product;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure Admin user exists for store references
        $role = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $admin = User::firstOrCreate(
            ['email' => 'admin_test@masterpos.local'],
            ['name' => 'Admin Test', 'password' => bcrypt('password')]
        );
        if (! $admin->hasRole('Admin')) {
            $admin->assignRole($role);
        }

        $this->category = ProductCategory::firstOrCreate(
            ['slug' => 'portal-gadgets'],
            ['name' => 'Portal Gadgets', 'status' => 'active']
        );

        $this->unit = Unit::firstOrCreate(
            ['name' => 'Piece'],
            ['short_code' => 'pc', 'status' => 'active']
        );

        $this->product = Product::create([
            'name'                => 'Smart Watch ' . uniqid(),
            'slug'                => 'smart-watch-' . uniqid(),
            'sku'                 => 'SW-' . rand(1000, 9999),
            'category_id'         => $this->category->id,
            'unit_id'             => $this->unit->id,
            'cost_price'          => 1200,
            'sale_price'          => 2000,
            'stock_qty'           => 10,
            'low_stock_threshold' => 2,
            'status'              => 'active',
            'is_active'           => true,
        ]);

        $this->customer = Customer::create([
            'name'                  => 'Kazi Nazrul',
            'phone'                 => '01711' . rand(100000, 999999),
            'email'                 => 'nazrul_' . uniqid() . '@example.com',
            'password'              => Hash::make('secret123'),
            'address'               => 'Dhanmondi, Dhaka',
            'city'                  => 'Dhaka',
            'default_delivery_type' => 'inside_dhaka',
            'is_active'             => true,
        ]);
    }

    public function test_customer_can_view_login_and_register_pages(): void
    {
        $loginRes = $this->get(route('customer.login'));
        $loginRes->assertStatus(200);

        $regRes = $this->get(route('customer.register'));
        $regRes->assertStatus(200);
    }

    public function test_customer_can_register_new_account(): void
    {
        $phone = '01811' . rand(100000, 999999);
        $response = $this->post(route('customer.register.submit'), [
            'name'                  => 'Shakib Al Hasan',
            'phone'                 => $phone,
            'email'                 => 'shakib_' . uniqid() . '@cricket.com',
            'address'               => 'Banani, Dhaka',
            'city'                  => 'Dhaka',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect(route('customer.orders'));
        $this->assertDatabaseHas('customers', [
            'phone' => $phone,
            'name'  => 'Shakib Al Hasan',
        ]);

        $this->assertTrue(Auth::guard('customer')->check());
        $this->assertEquals($phone, Auth::guard('customer')->user()->phone);
    }

    public function test_existing_guest_customer_can_register_and_activate_account(): void
    {
        $guestPhone = '01911' . rand(100000, 999999);

        // Simulate guest customer created earlier from POS or checkout
        $guest = Customer::create([
            'name'      => 'Guest Buyer',
            'phone'     => $guestPhone,
            'email'     => null,
            'password'  => null,
            'is_active' => true,
        ]);

        $response = $this->post(route('customer.register.submit'), [
            'name'                  => 'Registered Buyer',
            'phone'                 => $guestPhone,
            'email'                 => 'registered@domain.com',
            'address'               => 'Gulshan 2',
            'city'                  => 'Dhaka',
            'password'              => 'newsecurepass',
            'password_confirmation' => 'newsecurepass',
        ]);

        $response->assertRedirect(route('customer.orders'));

        $guest->refresh();
        $this->assertEquals('Registered Buyer', $guest->name);
        $this->assertNotNull($guest->password);
        $this->assertTrue(Hash::check('newsecurepass', $guest->password));
    }

    public function test_customer_can_login_with_phone_and_password(): void
    {
        $response = $this->post(route('customer.login.submit'), [
            'login'    => $this->customer->phone,
            'password' => 'secret123',
        ]);

        $response->assertRedirect(route('customer.orders'));
        $this->assertTrue(Auth::guard('customer')->check());
        $this->assertEquals($this->customer->id, Auth::guard('customer')->id());
    }

    public function test_customer_can_login_with_email_and_password(): void
    {
        $response = $this->post(route('customer.login.submit'), [
            'login'    => $this->customer->email,
            'password' => 'secret123',
        ]);

        $response->assertRedirect(route('customer.orders'));
        $this->assertTrue(Auth::guard('customer')->check());
        $this->assertEquals($this->customer->id, Auth::guard('customer')->id());
    }

    public function test_inactive_customer_cannot_login(): void
    {
        $this->customer->update(['is_active' => false]);

        $response = $this->from(route('customer.login'))->post(route('customer.login.submit'), [
            'login'    => $this->customer->phone,
            'password' => 'secret123',
        ]);

        $response->assertSessionHasErrors('login');
        $this->assertFalse(Auth::guard('customer')->check());
    }

    public function test_customer_can_view_orders_dashboard_and_order_detail(): void
    {
        // Create an order for customer
        $sale = Sale::create([
            'reference_no'           => Sale::generateReference(),
            'customer_id'            => $this->customer->id,
            'sale_date'              => today(),
            'subtotal'               => 2000,
            'discount'               => 0,
            'delivery_charge'        => 60,
            'grand_total'            => 2060,
            'paid_amount'            => 2060,
            'due_amount'             => 0,
            'payment_status'         => 'paid',
            'order_status'           => 'processing',
            'delivery_type'          => 'inside_dhaka',
            'delivery_address'       => 'Dhanmondi 27',
            'delivery_contact_phone' => $this->customer->phone,
            'created_by'             => 1,
        ]);

        SaleItem::create([
            'sale_id'    => $sale->id,
            'product_id' => $this->product->id,
            'quantity'   => 1,
            'unit_price' => 2000,
            'subtotal'   => 2000,
        ]);

        // Access orders list
        $ordersResponse = $this->actingAs($this->customer, 'customer')
            ->get(route('customer.orders'));
        $ordersResponse->assertStatus(200);

        // Access order detail
        $detailResponse = $this->actingAs($this->customer, 'customer')
            ->get(route('customer.orders.show', $sale->reference_no));
        $detailResponse->assertStatus(200);
    }

    public function test_customer_cannot_view_another_customers_order(): void
    {
        $otherCustomer = Customer::create([
            'name'     => 'Other Customer',
            'phone'    => '01799' . rand(100000, 999999),
            'password' => Hash::make('password'),
        ]);

        $otherSale = Sale::create([
            'reference_no'           => Sale::generateReference(),
            'customer_id'            => $otherCustomer->id,
            'sale_date'              => today(),
            'subtotal'               => 500,
            'discount'               => 0,
            'grand_total'            => 560,
            'paid_amount'            => 560,
            'due_amount'             => 0,
            'payment_status'         => 'paid',
            'order_status'           => 'delivered',
            'delivery_contact_phone' => $otherCustomer->phone,
            'created_by'             => 1,
        ]);

        // The current customer should receive 404
        $response = $this->actingAs($this->customer, 'customer')
            ->get(route('customer.orders.show', $otherSale->reference_no));

        $response->assertStatus(404);
    }

    public function test_customer_can_reorder_and_receive_cart_items(): void
    {
        $sale = Sale::create([
            'reference_no'           => Sale::generateReference(),
            'customer_id'            => $this->customer->id,
            'sale_date'              => today(),
            'subtotal'               => 2000,
            'discount'               => 0,
            'grand_total'            => 2060,
            'paid_amount'            => 2060,
            'due_amount'             => 0,
            'payment_status'         => 'paid',
            'order_status'           => 'delivered',
            'delivery_contact_phone' => $this->customer->phone,
            'created_by'             => 1,
        ]);

        SaleItem::create([
            'sale_id'    => $sale->id,
            'product_id' => $this->product->id,
            'quantity'   => 2,
            'unit_price' => 2000,
            'subtotal'   => 4000,
        ]);

        $response = $this->actingAs($this->customer, 'customer')
            ->postJson(route('customer.orders.reorder', $sale->reference_no));

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);
        $response->assertJsonFragment([
            'id'  => $this->product->id,
            'qty' => 2,
        ]);
    }

    public function test_customer_can_update_profile_and_change_password(): void
    {
        $response = $this->actingAs($this->customer, 'customer')
            ->put(route('customer.profile.update'), [
                'name'                  => 'Kazi Nazrul Updated',
                'email'                 => 'newemail_' . uniqid() . '@example.com',
                'address'               => 'Road 12, Dhanmondi',
                'city'                  => 'Dhaka',
                'default_delivery_type' => 'outside_dhaka',
                'current_password'      => 'secret123',
                'new_password'          => 'brandnewpass789',
                'new_password_confirmation' => 'brandnewpass789',
            ]);

        $response->assertRedirect(route('customer.profile'));

        $this->customer->refresh();
        $this->assertEquals('Kazi Nazrul Updated', $this->customer->name);
        $this->assertEquals('Road 12, Dhanmondi', $this->customer->address);
        $this->assertEquals('outside_dhaka', $this->customer->default_delivery_type);
        $this->assertTrue(Hash::check('brandnewpass789', $this->customer->password));
    }

    public function test_authenticated_customer_checkout_links_sale_to_customer_id(): void
    {
        $paymentMethod = PaymentMethod::firstOrCreate(
            ['name' => 'Cash on Delivery'],
            ['type' => 'cash', 'is_active' => true]
        );

        $response = $this->actingAs($this->customer, 'customer')
            ->post(route('public.checkout.store'), [
                'customer_name'     => $this->customer->name,
                'customer_phone'    => $this->customer->phone,
                'customer_email'    => $this->customer->email,
                'delivery_type'     => 'inside_dhaka',
                'delivery_address'  => 'Dhanmondi, House 14',
                'payment_type'      => 'cash_on_delivery',
                'items'             => [
                    [
                        'id'  => $this->product->id,
                        'qty' => 1,
                    ],
                ],
            ]);

        $sale = Sale::where('delivery_contact_phone', $this->customer->phone)->latest('id')->first();
        $this->assertNotNull($sale);
        $this->assertEquals($this->customer->id, $sale->customer_id);
        $response->assertRedirect(route('public.order-confirmed', $sale->reference_no));
    }
}
