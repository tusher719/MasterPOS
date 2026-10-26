<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\HoldOrder;
use App\Models\HoldOrderItem;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Services\PurchaseStockService;
use App\Services\SaleStockService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::first() ?? User::factory()->create([
            'name'     => 'Super Admin',
            'email'    => 'admin@masterpos.test',
            'password' => bcrypt('password'),
            'status'   => 'active',
        ]);

        // ── 1. Units ──────────────────────────────────────────────────────────
        $pcs = Unit::firstOrCreate(['short_code' => 'pcs'], ['name' => 'Pieces', 'is_active' => true]);
        $box = Unit::firstOrCreate(['short_code' => 'box'], ['name' => 'Box', 'is_active' => true]);
        $kg  = Unit::firstOrCreate(['short_code' => 'kg'], ['name' => 'Kilogram', 'is_active' => true]);

        // ── 2. Categories ─────────────────────────────────────────────────────
        $electronics = ProductCategory::firstOrCreate(
            ['slug' => 'electronics'],
            ['name' => 'Consumer Electronics', 'is_active' => true]
        );
        $accessories = ProductCategory::firstOrCreate(
            ['slug' => 'accessories'],
            ['name' => 'Computer Accessories', 'parent_id' => $electronics->id, 'is_active' => true]
        );
        $apparel = ProductCategory::firstOrCreate(
            ['slug' => 'apparel-fashion'],
            ['name' => 'Apparel & Fashion', 'is_active' => true]
        );
        $groceries = ProductCategory::firstOrCreate(
            ['slug' => 'groceries-beverages'],
            ['name' => 'Groceries & Beverages', 'is_active' => true]
        );

        // ── 3. Suppliers ──────────────────────────────────────────────────────
        $supplierApex = Supplier::firstOrCreate(
            ['email' => 'sales@apexelectronics.com'],
            [
                'name'            => 'Apex Electronics Ltd',
                'company'         => 'Apex Tech Distribution',
                'phone'           => '+8801711000001',
                'address'         => '12/A Motijheel C/A',
                'city'            => 'Dhaka',
                'country'         => 'Bangladesh',
                'opening_balance' => 0.00,
                'is_active'       => true,
            ]
        );

        $supplierBengal = Supplier::firstOrCreate(
            ['email' => 'supply@bengalgoods.com'],
            [
                'name'            => 'Bengal Consumer Goods',
                'company'         => 'Bengal Wholesale Group',
                'phone'           => '+8801711000002',
                'address'         => 'Khatungonj Wholesale Market',
                'city'            => 'Chittagong',
                'country'         => 'Bangladesh',
                'opening_balance' => 0.00,
                'is_active'       => true,
            ]
        );

        // ── 4. Customers ──────────────────────────────────────────────────────
        $walkInCustomer = Customer::firstOrCreate(
            ['phone' => '0000000000'],
            [
                'name'            => 'Walk-in Customer',
                'email'           => 'walkin@masterpos.test',
                'address'         => 'Storefront Checkout',
                'city'            => 'Dhaka',
                'country'         => 'Bangladesh',
                'opening_balance' => 0.00,
                'is_active'       => true,
            ]
        );

        $customerRahim = Customer::firstOrCreate(
            ['phone' => '+8801811223344'],
            [
                'name'            => 'Rahim Ahmed',
                'email'           => 'rahim.ahmed@example.com',
                'address'         => 'House 42, Road 11, Banani',
                'city'            => 'Dhaka',
                'country'         => 'Bangladesh',
                'opening_balance' => 0.00,
                'is_active'       => true,
            ]
        );

        $customerSumaiya = Customer::firstOrCreate(
            ['phone' => '+8801911998877'],
            [
                'name'            => 'Sumaiya Kabir',
                'email'           => 'sumaiya.kabir@example.com',
                'address'         => 'Dhanmondi 27',
                'city'            => 'Dhaka',
                'country'         => 'Bangladesh',
                'opening_balance' => 0.00,
                'is_active'       => true,
            ]
        );

        // ── 5. Payment Methods ────────────────────────────────────────────────
        $cashPayment = PaymentMethod::firstOrCreate(
            ['name' => 'Cash'],
            ['type' => 'cash', 'is_active' => true]
        );
        $cardPayment = PaymentMethod::firstOrCreate(
            ['name' => 'Credit / Debit Card'],
            ['type' => 'card', 'is_active' => true]
        );
        $bKashPayment = PaymentMethod::firstOrCreate(
            ['name' => 'bKash Merchant'],
            ['type' => 'mobile_banking', 'is_active' => true]
        );

        // ── 6. Products ───────────────────────────────────────────────────────
        $prodMouse = Product::firstOrCreate(
            ['barcode' => '890123456701'],
            [
                'name'                => 'Logitech MX Master 3S Wireless Mouse',
                'sku'                 => 'LOG-MX3S-GR',
                'category_id'         => $accessories->id,
                'unit_id'             => $pcs->id,
                'cost_price'          => 8500.00,
                'sale_price'          => 10500.00,
                'stock_qty'           => 0,
                'low_stock_threshold' => 5,
                'min_sale_qty'        => 1,
                'has_variants'        => false,
                'is_active'           => true,
                'is_featured'         => true,
                'description'         => 'Ergonomic performance wireless mouse with 8K DPI sensor.',
            ]
        );

        $prodKeyboard = Product::firstOrCreate(
            ['barcode' => '890123456702'],
            [
                'name'                => 'Keychron K2 Pro Mechanical Keyboard',
                'sku'                 => 'KEY-K2PRO-RED',
                'category_id'         => $accessories->id,
                'unit_id'             => $pcs->id,
                'cost_price'          => 9200.00,
                'sale_price'          => 11800.00,
                'stock_qty'           => 0,
                'low_stock_threshold' => 4,
                'min_sale_qty'        => 1,
                'has_variants'        => false,
                'is_active'           => true,
                'is_featured'         => true,
                'description'         => 'Wireless custom mechanical keyboard with hot-swappable switches.',
            ]
        );

        $prodHeadphones = Product::firstOrCreate(
            ['barcode' => '890123456703'],
            [
                'name'                => 'Sony WH-1000XM5 Wireless Headphones',
                'sku'                 => 'SNY-XM5-BLK',
                'category_id'         => $electronics->id,
                'unit_id'             => $pcs->id,
                'cost_price'          => 32000.00,
                'sale_price'          => 37500.00,
                'stock_qty'           => 0,
                'low_stock_threshold' => 3,
                'min_sale_qty'        => 1,
                'has_variants'        => false,
                'is_active'           => true,
                'is_featured'         => true,
                'description'         => 'Industry leading noise cancelling bluetooth headphones.',
            ]
        );

        $prodCoffee = Product::firstOrCreate(
            ['barcode' => '890123456704'],
            [
                'name'                => 'Nescafe Gold Dark Roast Blend 200g',
                'sku'                 => 'NES-GOLD-200G',
                'category_id'         => $groceries->id,
                'unit_id'             => $box->id,
                'cost_price'          => 750.00,
                'sale_price'          => 980.00,
                'stock_qty'           => 0,
                'low_stock_threshold' => 10,
                'min_sale_qty'        => 1,
                'has_variants'        => false,
                'is_active'           => true,
                'is_featured'         => false,
                'description'         => 'Premium crafted soluble coffee with rich aroma.',
            ]
        );

        $prodTShirt = Product::firstOrCreate(
            ['barcode' => '890123456705'],
            [
                'name'                => 'Premium Organic Cotton Crewneck T-Shirt',
                'sku'                 => 'TSH-ORG-SLM',
                'category_id'         => $apparel->id,
                'unit_id'             => $pcs->id,
                'cost_price'          => 450.00,
                'sale_price'          => 850.00,
                'stock_qty'           => 0,
                'low_stock_threshold' => 15,
                'min_sale_qty'        => 1,
                'has_variants'        => true,
                'is_active'           => true,
                'is_featured'         => true,
                'description'         => 'Breathable 100% combed cotton unisex casual wear.',
            ]
        );

        // Product Variants for T-Shirt
        if ($prodTShirt->variants()->count() === 0) {
            ProductVariant::create([
                'product_id'          => $prodTShirt->id,
                'sku'                 => 'TSH-BLK-M',
                'attributes'          => ['Color' => 'Black', 'Size' => 'M'],
                'cost_price_override' => 450.00,
                'price_override'      => 850.00,
                'stock_qty'           => 25,
                'is_active'           => true,
            ]);
            ProductVariant::create([
                'product_id'          => $prodTShirt->id,
                'sku'                 => 'TSH-NVY-L',
                'attributes'          => ['Color' => 'Navy Blue', 'Size' => 'L'],
                'cost_price_override' => 450.00,
                'price_override'      => 850.00,
                'stock_qty'           => 30,
                'is_active'           => true,
            ]);
        }

        // ── 7. Purchases (Stock Inflow) ────────────────────────────────────────
        $purchaseStockService = app(PurchaseStockService::class);

        $purchase1 = Purchase::firstOrCreate(
            ['reference_no' => 'PO-2026-0001'],
            [
                'supplier_id'     => $supplierApex->id,
                'purchase_date'   => Carbon::now()->subDays(5)->toDateString(),
                'purchase_status' => 'received',
                'subtotal'        => 386000.00,
                'discount'        => 6000.00,
                'tax'             => 0.00,
                'shipping_cost'   => 1500.00,
                'grand_total'     => 381500.00,
                'paid_amount'     => 381500.00,
                'due_amount'      => 0.00,
                'payment_status'  => 'paid',
                'note'            => 'Initial tech inventory shipment from Apex Ltd.',
                'created_by'      => $admin->id,
            ]
        );

        if ($purchase1->items()->count() === 0) {
            PurchaseItem::create([
                'purchase_id' => $purchase1->id,
                'product_id'  => $prodMouse->id,
                'quantity'    => 20,
                'unit_cost'   => 8500.00,
                'subtotal'    => 170000.00,
            ]);
            PurchaseItem::create([
                'purchase_id' => $purchase1->id,
                'product_id'  => $prodKeyboard->id,
                'quantity'    => 15,
                'unit_cost'   => 9200.00,
                'subtotal'    => 138000.00,
            ]);
            PurchaseItem::create([
                'purchase_id' => $purchase1->id,
                'product_id'  => $prodHeadphones->id,
                'quantity'    => 5,
                'unit_cost'   => 32000.00,
                'subtotal'    => 160000.00,
            ]);

            // Apply stock movements and inventory
            $purchaseStockService->applyStock($purchase1);
        }

        $purchase2 = Purchase::firstOrCreate(
            ['reference_no' => 'PO-2026-0002'],
            [
                'supplier_id'     => $supplierBengal->id,
                'purchase_date'   => Carbon::now()->subDays(3)->toDateString(),
                'purchase_status' => 'received',
                'subtotal'        => 37500.00,
                'discount'        => 0.00,
                'tax'             => 0.00,
                'shipping_cost'   => 500.00,
                'grand_total'     => 38000.00,
                'paid_amount'     => 38000.00,
                'due_amount'      => 0.00,
                'payment_status'  => 'paid',
                'note'            => 'Beverages bulk restock.',
                'created_by'      => $admin->id,
            ]
        );

        if ($purchase2->items()->count() === 0) {
            PurchaseItem::create([
                'purchase_id' => $purchase2->id,
                'product_id'  => $prodCoffee->id,
                'quantity'    => 50,
                'unit_cost'   => 750.00,
                'subtotal'    => 37500.00,
            ]);
            $purchaseStockService->applyStock($purchase2);
        }

        // ── 8. Sales & Transactions (POS Outflow) ─────────────────────────────
        $saleStockService = app(SaleStockService::class);

        $sale1 = Sale::firstOrCreate(
            ['reference_no' => 'INV-2026-0001'],
            [
                'customer_id'       => $customerRahim->id,
                'sale_date'         => Carbon::now()->subDays(2)->toDateString(),
                'subtotal'          => 22300.00,
                'discount'          => 500.00,
                'tax'               => 0.00,
                'grand_total'       => 21800.00,
                'paid_amount'       => 21800.00,
                'due_amount'        => 0.00,
                'payment_status'    => 'paid',
                'payment_method_id' => $cardPayment->id,
                'order_status'      => 'delivered',
                'delivery_type'     => 'store_pickup',
                'note'              => 'Walk-in card payment completed.',
                'created_by'        => $admin->id,
            ]
        );

        if ($sale1->items()->count() === 0) {
            SaleItem::create([
                'sale_id'    => $sale1->id,
                'product_id' => $prodMouse->id,
                'quantity'   => 1,
                'unit_price' => 10500.00,
                'subtotal'   => 10500.00,
            ]);
            SaleItem::create([
                'sale_id'    => $sale1->id,
                'product_id' => $prodKeyboard->id,
                'quantity'   => 1,
                'unit_price' => 11800.00,
                'subtotal'   => 11800.00,
            ]);

            SalePayment::create([
                'sale_id'           => $sale1->id,
                'payment_method_id' => $cardPayment->id,
                'amount'            => 21800.00,
                'payment_date'      => Carbon::now()->subDays(2)->toDateString(),
                'note'              => 'POS Terminal Card Transaction',
                'created_by'        => $admin->id,
            ]);

            $saleStockService->applyStock($sale1);
        }

        $sale2 = Sale::firstOrCreate(
            ['reference_no' => 'INV-2026-0002'],
            [
                'customer_id'       => $walkInCustomer->id,
                'sale_date'         => Carbon::now()->toDateString(),
                'subtotal'          => 1960.00,
                'discount'          => 0.00,
                'tax'               => 0.00,
                'grand_total'       => 1960.00,
                'paid_amount'       => 1960.00,
                'due_amount'        => 0.00,
                'payment_status'    => 'paid',
                'payment_method_id' => $cashPayment->id,
                'order_status'      => 'delivered',
                'delivery_type'     => 'store_pickup',
                'note'              => 'Cash retail checkout.',
                'created_by'        => $admin->id,
            ]
        );

        if ($sale2->items()->count() === 0) {
            SaleItem::create([
                'sale_id'    => $sale2->id,
                'product_id' => $prodCoffee->id,
                'quantity'   => 2,
                'unit_price' => 980.00,
                'subtotal'   => 1960.00,
            ]);

            SalePayment::create([
                'sale_id'           => $sale2->id,
                'payment_method_id' => $cashPayment->id,
                'amount'            => 1960.00,
                'payment_date'      => Carbon::now()->toDateString(),
                'note'              => 'Cash Register POS',
                'created_by'        => $admin->id,
            ]);

            $saleStockService->applyStock($sale2);
        }

        // ── 9. Hold Orders (Pending in POS) ───────────────────────────────────
        $hold1 = HoldOrder::firstOrCreate(
            ['reference_no' => 'HOLD-2026-0001'],
            [
                'customer_id' => $customerSumaiya->id,
                'note'        => 'Customer selecting extra accessories',
                'status'      => 'active',
                'subtotal'    => 37500.00,
                'discount'    => 0.00,
                'tax'         => 0.00,
                'grand_total' => 37500.00,
                'expires_at'  => Carbon::now()->addHours(24),
                'created_by'  => $admin->id,
            ]
        );

        if ($hold1->items()->count() === 0) {
            HoldOrderItem::create([
                'hold_order_id' => $hold1->id,
                'product_id'    => $prodHeadphones->id,
                'quantity'      => 1,
                'unit_price'    => 37500.00,
                'subtotal'      => 37500.00,
            ]);
        }
    }
}
