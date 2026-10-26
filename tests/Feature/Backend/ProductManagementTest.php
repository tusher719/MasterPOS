<?php

namespace Tests\Feature\Backend;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductVariant;
use App\Models\Unit;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\Step04PermissionSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->seed(Step04PermissionSeeder::class);

        $this->admin = User::factory()->create([
            'email' => 'admin_product_' . uniqid() . '@example.com',
        ]);
        $this->admin->assignRole('Admin');

        $this->staff = User::factory()->create([
            'email' => 'staff_product_' . uniqid() . '@example.com',
        ]);
        $this->staff->assignRole('Staff');
    }

    // ─── Units ──────────────────────────────────────────────────────────────────

    public function test_admin_can_view_units_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.units.index'));

        $response->assertOk();
    }

    public function test_admin_can_create_unit(): void
    {
        $code = 'u_' . substr(uniqid(), 0, 8);

        $response = $this->actingAs($this->admin)->post(route('backend.units.store'), [
            'name'       => 'Test Unit ' . $code,
            'short_code' => $code,
            'is_active'  => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('units', [
            'short_code' => $code,
            'is_active'  => true,
        ]);
    }

    public function test_admin_can_update_unit(): void
    {
        $unit = Unit::create([
            'name'       => 'Gram_' . uniqid(),
            'short_code' => 'g_' . substr(uniqid(), 0, 6),
            'is_active'  => true,
        ]);

        $response = $this->actingAs($this->admin)->put(route('backend.units.update', $unit->id), [
            'name'       => 'Kilogram Modified',
            'short_code' => $unit->short_code,
            'is_active'  => false,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('units', [
            'id'        => $unit->id,
            'name'      => 'Kilogram Modified',
            'is_active' => false,
        ]);
    }

    public function test_admin_cannot_delete_unit_assigned_to_products(): void
    {
        $unit = Unit::create([
            'name'       => 'Piece_' . uniqid(),
            'short_code' => 'pc_' . substr(uniqid(), 0, 6),
            'is_active'  => true,
        ]);

        Product::create([
            'name'                => 'Product with Unit ' . uniqid(),
            'sku'                 => 'SKU_' . uniqid(),
            'unit_id'             => $unit->id,
            'cost_price'          => 10,
            'sale_price'          => 20,
            'stock_qty'           => 5,
            'low_stock_threshold' => 2,
            'is_active'           => true,
        ]);

        $response = $this->actingAs($this->admin)->delete(route('backend.units.destroy', $unit->id));

        $response->assertSessionHasErrors(['error']);
        $this->assertDatabaseHas('units', ['id' => $unit->id]);
    }

    public function test_admin_can_delete_unused_unit(): void
    {
        $unit = Unit::create([
            'name'       => 'Unused_' . uniqid(),
            'short_code' => 'un_' . substr(uniqid(), 0, 6),
            'is_active'  => true,
        ]);

        $response = $this->actingAs($this->admin)->delete(route('backend.units.destroy', $unit->id));

        $response->assertRedirect();
        $this->assertDatabaseMissing('units', ['id' => $unit->id]);
    }

    // ─── Categories ─────────────────────────────────────────────────────────────

    public function test_admin_can_view_product_categories(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.product-categories.index'));

        $response->assertOk();
    }

    public function test_admin_can_create_product_category(): void
    {
        $catName = 'Beverages_' . uniqid();

        $response = $this->actingAs($this->admin)->post(route('backend.product-categories.store'), [
            'name'        => $catName,
            'description' => 'Cold and hot drinks',
            'sort_order'  => 1,
            'is_active'   => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('product_categories', [
            'name' => $catName,
        ]);
    }

    public function test_admin_cannot_delete_category_with_subcategories(): void
    {
        $parent = ProductCategory::create([
            'name'      => 'Parent Cat ' . uniqid(),
            'slug'      => 'parent-' . uniqid(),
            'is_active' => true,
        ]);

        ProductCategory::create([
            'name'      => 'Sub Cat ' . uniqid(),
            'slug'      => 'sub-' . uniqid(),
            'parent_id' => $parent->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->delete(route('backend.product-categories.destroy', $parent->id));

        $response->assertSessionHasErrors(['error']);
        $this->assertDatabaseHas('product_categories', ['id' => $parent->id]);
    }

    // ─── Products ───────────────────────────────────────────────────────────────

    public function test_admin_can_view_products_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.products.index'));

        $response->assertOk();
    }

    public function test_admin_can_create_simple_product(): void
    {
        $sku = 'PRD_' . uniqid();
        $name = 'Organic Brown Rice ' . uniqid();

        $response = $this->actingAs($this->admin)->post(route('backend.products.store'), [
            'name'                => $name,
            'sku'                 => $sku,
            'barcode'             => 'BC_' . uniqid(),
            'cost_price'          => '55.00',
            'sale_price'          => '80.00',
            'stock_qty'           => '100.00',
            'low_stock_threshold' => '10.00',
            'is_active'           => true,
        ]);

        $response->assertRedirect(route('backend.products.index'));
        $this->assertDatabaseHas('products', [
            'sku'        => $sku,
            'sale_price' => 80.00,
        ]);

        $product = Product::where('sku', $sku)->first();
        $this->assertNotNull($product->slug);
    }

    public function test_admin_can_create_product_with_variants(): void
    {
        $sku = 'TSHIRT_' . uniqid();
        $var1Sku = $sku . '-RED-M';
        $var2Sku = $sku . '-BLUE-L';

        $variantsJson = json_encode([
            [
                'sku'            => $var1Sku,
                'attributes'     => ['color' => 'Red', 'size' => 'M'],
                'stock_qty'      => 20,
                'price_override' => '450.00',
                'is_active'      => true,
            ],
            [
                'sku'            => $var2Sku,
                'attributes'     => ['color' => 'Blue', 'size' => 'L'],
                'stock_qty'      => 30,
                'price_override' => '480.00',
                'is_active'      => true,
            ],
        ]);

        $response = $this->actingAs($this->admin)->post(route('backend.products.store'), [
            'name'                => 'Cotton T-Shirt ' . uniqid(),
            'sku'                 => $sku,
            'cost_price'          => '250.00',
            'sale_price'          => '450.00',
            'stock_qty'           => '50.00',
            'low_stock_threshold' => '5.00',
            'has_variants'        => true,
            'variants'            => $variantsJson,
            'is_active'           => true,
        ]);

        $response->assertRedirect(route('backend.products.index'));
        $this->assertDatabaseHas('products', ['sku' => $sku, 'has_variants' => true]);
        $this->assertDatabaseHas('product_variants', ['sku' => $var1Sku, 'price_override' => 450.00]);
        $this->assertDatabaseHas('product_variants', ['sku' => $var2Sku, 'price_override' => 480.00]);
    }

    public function test_admin_can_update_product(): void
    {
        $product = Product::create([
            'name'                => 'Old Name ' . uniqid(),
            'sku'                 => 'SKU_' . uniqid(),
            'cost_price'          => 100,
            'sale_price'          => 150,
            'stock_qty'           => 10,
            'low_stock_threshold' => 2,
            'is_active'           => true,
        ]);

        $response = $this->actingAs($this->admin)->put(route('backend.products.update', $product->id), [
            'name'                => 'Updated Name',
            'sku'                 => $product->sku,
            'cost_price'          => '110.00',
            'sale_price'          => '160.00',
            'stock_qty'           => '15.00',
            'low_stock_threshold' => '3.00',
            'is_active'           => true,
        ]);

        $response->assertRedirect(route('backend.products.index'));
        $this->assertDatabaseHas('products', [
            'id'         => $product->id,
            'name'       => 'Updated Name',
            'sale_price' => 160.00,
        ]);
    }

    public function test_admin_can_delete_product(): void
    {
        $product = Product::create([
            'name'                => 'To Delete ' . uniqid(),
            'sku'                 => 'SKU_' . uniqid(),
            'cost_price'          => 50,
            'sale_price'          => 80,
            'stock_qty'           => 10,
            'low_stock_threshold' => 2,
            'is_active'           => true,
        ]);

        $response = $this->actingAs($this->admin)->delete(route('backend.products.destroy', $product->id));

        $response->assertRedirect();
        $this->assertSoftDeleted($product);
    }

    public function test_admin_can_search_products_via_ajax(): void
    {
        $product = Product::create([
            'name'                => 'Searchable Unique Item ' . uniqid(),
            'sku'                 => 'SRCH_' . uniqid(),
            'cost_price'          => 50,
            'sale_price'          => 80,
            'stock_qty'           => 10,
            'low_stock_threshold' => 2,
            'is_active'           => true,
        ]);

        $response = $this->actingAs($this->admin)->getJson(route('backend.products.search', ['q' => 'Searchable Unique']));

        $response->assertOk();
        $response->assertJsonFragment(['sku' => $product->sku]);
    }

    public function test_user_without_permission_cannot_access_products(): void
    {
        $unauthorized = User::factory()->create();

        $response = $this->actingAs($unauthorized)->get(route('backend.products.index'));
        $response->assertForbidden();

        $response = $this->actingAs($unauthorized)->get(route('backend.units.index'));
        $response->assertForbidden();

        $response = $this->actingAs($unauthorized)->get(route('backend.product-categories.index'));
        $response->assertForbidden();
    }

    public function test_staff_cannot_create_or_delete_product(): void
    {
        $response = $this->actingAs($this->staff)->post(route('backend.products.store'), [
            'name'                => 'Staff Product Attempt',
            'sku'                 => 'STAFF_SKU_' . uniqid(),
            'cost_price'          => '10.00',
            'sale_price'          => '20.00',
            'stock_qty'           => '10.00',
            'low_stock_threshold' => '2.00',
            'is_active'           => true,
        ]);

        $response->assertForbidden();
    }
}
