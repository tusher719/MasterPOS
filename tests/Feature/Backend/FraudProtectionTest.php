<?php

namespace Tests\Feature\Backend;

use App\Models\BusinessSetting;
use App\Models\Customer;
use App\Models\FraudFlag;
use App\Models\OrderAttemptLog;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FraudProtectionTest extends TestCase
{
    use DatabaseTransactions;

    private User $admin;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
        $this->seed(\Database\Seeders\FraudFlagSeeder::class);

        $this->admin = User::factory()->create(['email_verified_at' => now()]);
        $this->admin->assignRole('Admin');

        $unit = Unit::create(['name' => 'Piece', 'short_code' => 'pc', 'is_active' => true]);
        $this->product = Product::create([
            'name'                => 'Test Polo Shirt',
            'slug'                => 'test-polo-shirt',
            'sku'                 => 'POLO-001',
            'unit_id'             => $unit->id,
            'cost_price'          => 300,
            'sale_price'          => 600,
            'stock_qty'           => 50,
            'low_stock_threshold' => 5,
            'is_active'           => true,
        ]);
    }

    public function test_checkout_blocks_phone_number_with_confirmed_fraud(): void
    {
        $flag = FraudFlag::create([
            'phone'              => '01711223344',
            'full_name_snapshot' => 'Bad Actor',
            'reason'             => 'fake_order',
            'trigger_type'       => 'manual',
            'flagged_by'         => $this->admin->id,
            'flagged_at'         => now(),
        ]);
        $flag->confirmFraud($this->admin->id, 'Confirmed fake orders.');

        $payload = [
            'customer_name'    => 'Real Name Guy',
            'customer_phone'   => '01711223344',
            'delivery_type'    => 'inside_dhaka',
            'delivery_address' => 'House 12 Road 5 Dhanmondi Dhaka',
            'payment_type'     => 'cash_on_delivery',
            'items'            => [
                ['id' => $this->product->id, 'qty' => 1],
            ],
        ];

        $response = $this->post('/checkout', $payload);
        $response->assertSessionHasErrors('customer_phone');
    }

    public function test_checkout_blocks_gibberish_customer_name_layer1(): void
    {
        $payload = [
            'customer_name'    => '12345678', // purely numeric
            'customer_phone'   => '01711998877',
            'delivery_type'    => 'inside_dhaka',
            'delivery_address' => 'House 12 Road 5 Dhanmondi Dhaka',
            'payment_type'     => 'cash_on_delivery',
            'items'            => [
                ['id' => $this->product->id, 'qty' => 1],
            ],
        ];

        $response = $this->post('/checkout', $payload);
        $response->assertSessionHasErrors('customer_name');
    }

    public function test_checkout_blocks_short_address_layer1(): void
    {
        $payload = [
            'customer_name'    => 'Tusher Hasan',
            'customer_phone'   => '01711998877',
            'delivery_type'    => 'inside_dhaka',
            'delivery_address' => 'Dhaka', // only 1 word, min is 3 words
            'payment_type'     => 'cash_on_delivery',
            'items'            => [
                ['id' => $this->product->id, 'qty' => 1],
            ],
        ];

        $response = $this->post('/checkout', $payload);
        $response->assertSessionHasErrors('delivery_address');
    }

    public function test_checkout_blocks_invalid_bangladeshi_phone_number(): void
    {
        $payload = [
            'customer_name'    => 'Tusher Hasan',
            'customer_phone'   => '01211998877', // 012 is invalid in BD
            'delivery_type'    => 'inside_dhaka',
            'delivery_address' => 'House 12 Road 5 Dhanmondi Dhaka',
            'payment_type'     => 'cash_on_delivery',
            'items'            => [
                ['id' => $this->product->id, 'qty' => 1],
            ],
        ];

        $response = $this->post('/checkout', $payload);
        $response->assertSessionHasErrors('customer_phone');
    }

    public function test_checkout_enforces_ip_order_attempt_limit_layer2(): void
    {
        BusinessSetting::set('fraud_ip_order_limit_per_24h', 2);

        $ip = '192.168.1.100';

        // Pre-seed 2 attempt logs for this IP
        OrderAttemptLog::create(['ip_address' => $ip, 'attempted_at' => now()->subMinutes(10), 'was_blocked' => false]);
        OrderAttemptLog::create(['ip_address' => $ip, 'attempted_at' => now()->subMinutes(5), 'was_blocked' => false]);

        $payload = [
            'customer_name'    => 'Tusher Hasan',
            'customer_phone'   => '01711998877',
            'delivery_type'    => 'inside_dhaka',
            'delivery_address' => 'House 12 Road 5 Dhanmondi Dhaka',
            'payment_type'     => 'cash_on_delivery',
            'items'            => [
                ['id' => $this->product->id, 'qty' => 1],
            ],
        ];

        // 3rd attempt exceeds limit of 2
        $response = $this->withServerVariables(['REMOTE_ADDR' => $ip])->post('/checkout', $payload);
        $response->assertSessionHasErrors('customer_phone');
    }

    public function test_admin_can_review_and_confirm_fraud_flag(): void
    {
        $flag = FraudFlag::create([
            'phone'              => '01899001122',
            'full_name_snapshot' => 'Suspicious User',
            'reason'             => 'fake_order',
            'trigger_type'       => 'auto_layer2',
            'status'             => 'pending_review',
            'flagged_at'         => now(),
        ]);

        $response = $this->actingAs($this->admin)->post(route('backend.fraud-flags.review', $flag), [
            'action'      => 'confirm',
            'review_note' => 'Confirmed repeatedly rejecting orders on COD.',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('fraud_flags', [
            'id'          => $flag->id,
            'status'      => 'confirmed_fraud',
            'reviewed_by' => $this->admin->id,
        ]);
    }

    public function test_admin_can_review_and_clear_fraud_flag(): void
    {
        $flag = FraudFlag::create([
            'phone'              => '01899001122',
            'full_name_snapshot' => 'False Positive',
            'reason'             => 'ip_limit_exceeded',
            'trigger_type'       => 'auto_layer2',
            'status'             => 'pending_review',
            'flagged_at'         => now(),
        ]);

        $response = $this->actingAs($this->admin)->post(route('backend.fraud-flags.review', $flag), [
            'action'      => 'clear',
            'review_note' => 'Verified as legitimate customer.',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('fraud_flags', [
            'id'          => $flag->id,
            'status'      => 'cleared',
            'reviewed_by' => $this->admin->id,
        ]);
    }
}
