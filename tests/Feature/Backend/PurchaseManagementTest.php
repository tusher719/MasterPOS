<?php

namespace Tests\Feature\Backend;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PurchaseManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $unauthorizedUser;
    protected Supplier $supplier;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Staff']);

        $this->admin = User::factory()->create(['status' => 'active']);
        $this->admin->assignRole('Admin');

        $this->unauthorizedUser = User::factory()->create(['status' => 'active']);

        $this->supplier = Supplier::create([
            'name'            => 'National Tech Ltd',
            'company'         => 'National Tech Co',
            'email'           => 'national.tech@example.com',
            'phone'           => '+8801700223344',
            'opening_balance' => 0.00,
            'is_active'       => true,
        ]);

        $unit = Unit::firstOrCreate(['short_code' => 'pcs'], ['name' => 'Pieces', 'is_active' => true]);

        $this->product = Product::create([
            'name'                => 'Dell Pro Wireless Optical Mouse',
            'sku'                 => 'DEL-MS-116',
            'barcode'             => '998877665544',
            'unit_id'             => $unit->id,
            'cost_price'          => 500.00,
            'sale_price'          => 750.00,
            'stock_qty'           => 10,
            'low_stock_threshold' => 5,
            'is_active'           => true,
        ]);
    }

    public function test_admin_can_view_purchases_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.purchases.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_create_received_purchase_and_increment_stock(): void
    {
        $initialStock = (float) $this->product->stock_qty;

        $payload = [
            'supplier_id'     => $this->supplier->id,
            'reference_no'    => 'PO-TEST-' . time(),
            'purchase_date'   => Carbon::now()->toDateString(),
            'purchase_status' => 'received',
            'items'           => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 20,
                    'unit_cost'  => 520.00,
                ],
            ],
            'discount'        => 0.00,
            'tax'             => 0.00,
            'shipping_cost'   => 0.00,
            'paid_amount'     => 10400.00,
            'payment_method_id' => 1,
            'note'            => 'Received purchase feature test',
        ];

        $response = $this->actingAs($this->admin)->post(route('backend.purchases.store'), $payload);
        $response->assertRedirect();

        $purchase = Purchase::where('supplier_id', $this->supplier->id)->latest()->first();
        $this->assertNotNull($purchase);
        $this->assertNotNull($purchase->uuid);
        $this->assertEquals('received', $purchase->purchase_status);

        $this->product->refresh();
        $this->assertEquals($initialStock + 20, (float) $this->product->stock_qty);
    }

    public function test_admin_can_search_purchases_for_return(): void
    {
        $purchase = Purchase::create([
            'supplier_id'     => $this->supplier->id,
            'reference_no'    => 'PO-RET-' . time(),
            'purchase_date'   => Carbon::now()->toDateString(),
            'purchase_status' => 'received',
            'subtotal'        => 5000.00,
            'grand_total'     => 5000.00,
            'paid_amount'     => 5000.00,
            'due_amount'      => 0.00,
            'payment_status'  => 'paid',
            'created_by'      => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->getJson(route('backend.purchases.search-for-return', ['search' => $purchase->reference_no]));
        $response->assertStatus(200);
        $response->assertJsonStructure(['purchases' => ['data']]);
    }

    public function test_admin_can_soft_delete_purchase(): void
    {
        $purchase = Purchase::create([
            'supplier_id'     => $this->supplier->id,
            'reference_no'    => 'PO-DEL-' . time(),
            'purchase_date'   => Carbon::now()->toDateString(),
            'purchase_status' => 'ordered',
            'subtotal'        => 2000.00,
            'grand_total'     => 2000.00,
            'paid_amount'     => 0.00,
            'due_amount'      => 2000.00,
            'payment_status'  => 'due',
            'created_by'      => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->delete(route('backend.purchases.destroy', $purchase));
        $response->assertRedirect();

        $this->assertSoftDeleted('purchases', ['id' => $purchase->id]);
    }

    public function test_unauthorized_user_cannot_access_purchases(): void
    {
        $response = $this->actingAs($this->unauthorizedUser)->get(route('backend.purchases.index'));
        $response->assertStatus(403);
    }
}
