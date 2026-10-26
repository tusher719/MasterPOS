<?php

namespace Tests\Feature\Backend;

use App\Models\ProductCategory;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchaseReturn;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PurchaseReturnManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $unauthorizedUser;
    protected Supplier $supplier;
    protected Product $product;
    protected Purchase $purchase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Staff']);

        $this->admin = User::factory()->create(['status' => 'active']);
        $this->admin->assignRole('Admin');

        $this->unauthorizedUser = User::factory()->create(['status' => 'active']);

        $unit = Unit::firstOrCreate(
            ['name' => 'Piece'],
            ['short_name' => 'pc', 'allow_decimal' => false]
        );

        $category = ProductCategory::firstOrCreate(
            ['slug' => 'return-test-category'],
            ['name' => 'Return Test Category', 'is_active' => true]
        );

        $this->product = Product::create([
            'name'                => 'Returnable Component Alpha',
            'sku'                 => 'RET-ALPHA-01',
            'barcode'             => '8901234567890',
            'category_id'         => $category->id,
            'unit_id'             => $unit->id,
            'cost_price'          => 1000.00,
            'sale_price'          => 1400.00,
            'stock_qty'           => 50,
            'low_stock_threshold' => 5,
            'is_active'           => true,
            'created_by'          => $this->admin->id,
        ]);

        $this->supplier = Supplier::create([
            'name'      => 'Return Test Supplier Ltd',
            'email'     => 'ret.supplier@test.com',
            'phone'     => '+8801999888777',
            'address'   => 'Tejgaon I/A, Dhaka',
            'is_active' => true,
        ]);

        $this->purchase = Purchase::create([
            'reference_no'    => 'PO-RET-TEST-01',
            'supplier_id'     => $this->supplier->id,
            'purchase_date'   => now()->toDateString(),
            'purchase_status' => 'received',
            'payment_status'  => 'paid',
            'total_amount'    => 20000.00,
            'paid_amount'     => 20000.00,
            'due_amount'      => 0.00,
            'created_by'      => $this->admin->id,
        ]);

        PurchaseItem::create([
            'purchase_id' => $this->purchase->id,
            'product_id'  => $this->product->id,
            'quantity'    => 20,
            'unit_cost'   => 1000.00,
            'subtotal'    => 20000.00,
        ]);
    }

    public function test_admin_can_view_purchase_returns_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.purchase-returns.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_create_purchase_return_draft_with_uuid(): void
    {
        $payload = [
            'purchase_id' => $this->purchase->id,
            'return_date' => now()->toDateString(),
            'return_type' => 'supplier_return',
            'reason'      => 'Defective batch received from vendor',
            'note'        => 'Returning 5 units out of 20 purchased',
            'items'       => [
                [
                    'product_id'  => $this->product->id,
                    'quantity'    => 5,
                    'unit_cost'   => 1000.00,
                    'reason_note' => 'Faulty soldering',
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->post(route('backend.purchase-returns.store'), $payload);
        $response->assertRedirect();

        $return = PurchaseReturn::where('purchase_id', $this->purchase->id)->first();
        $this->assertNotNull($return);
        $this->assertNotNull($return->uuid);
        $this->assertEquals('draft', $return->status);
        $this->assertEquals(5000.00, (float) $return->total_return_value);
        $this->assertEquals(1, $return->items()->count());

        // Ensure stock has NOT been deducted yet (Rule: stock deducted only on confirm)
        $this->assertEquals(50, $this->product->fresh()->stock_qty);
    }

    public function test_admin_can_confirm_purchase_return_and_deduct_stock(): void
    {
        $return = PurchaseReturn::create([
            'purchase_id'        => $this->purchase->id,
            'return_date'        => now()->toDateString(),
            'return_type'        => 'supplier_return',
            'status'             => 'draft',
            'total_return_value' => 5000.00,
            'reason'             => 'Defective items to return',
            'created_by'         => $this->admin->id,
        ]);

        $return->items()->create([
            'product_id' => $this->product->id,
            'quantity'   => 5,
            'unit_cost'  => 1000.00,
            'subtotal'   => 5000.00,
        ]);

        $response = $this->actingAs($this->admin)->post(route('backend.purchase-returns.confirm', $return));
        $response->assertRedirect();

        $return->refresh();
        $this->assertEquals('confirmed', $return->status);
        $this->assertEquals($this->admin->id, $return->confirmed_by);

        // Product stock must be decremented from 50 to 45
        $this->assertEquals(45, $this->product->fresh()->stock_qty);

        // Stock movement must be recorded
        $movement = StockMovement::where('reference_type', 'purchase_return')
            ->where('reference_id', $return->id)
            ->first();
        $this->assertNotNull($movement);
        $this->assertEquals('return', $movement->type);
        $this->assertEquals(-5, (float) $movement->quantity);
    }

    public function test_unauthorized_user_cannot_create_purchase_return(): void
    {
        $payload = [
            'purchase_id' => $this->purchase->id,
            'return_date' => now()->toDateString(),
            'return_type' => 'supplier_return',
            'reason'      => 'Unauthorized attempt to return',
            'items'       => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                    'unit_cost'  => 1000.00,
                ],
            ],
        ];

        $response = $this->actingAs($this->unauthorizedUser)->post(route('backend.purchase-returns.store'), $payload);
        $response->assertStatus(403);
    }
}
