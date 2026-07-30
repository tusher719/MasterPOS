<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Notifications\LowStockNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Models\User;

class SaleStockService
{
    /**
     * Deduct stock for each sale item.
     * Called after a sale is created.
     * Uses lockForUpdate() to prevent race conditions on concurrent sales.
     */
    public function applyStock(Sale $sale): void
    {
        foreach ($sale->items as $item) {
            DB::transaction(function () use ($item, $sale) {
                $product = Product::lockForUpdate()->find($item->product_id);
                if (!$product) return;

                if ($item->variant_id) {
                    $variant = ProductVariant::lockForUpdate()->find($item->variant_id);
                    if ($variant) {
                        $before = (float) $variant->stock_qty;
                        $after  = $before - (float) $item->quantity;
                        $variant->stock_qty = $after;
                        $variant->save();
                    }
                } else {
                    $before = (float) $product->stock_qty;
                    $after  = $before - (float) $item->quantity;
                    $product->stock_qty = $after;
                    $product->save();
                }

                StockMovement::create([
                    'product_id'      => $product->id,
                    'variant_id'      => $item->variant_id ?? null,
                    'reference_type'  => Sale::class,
                    'reference_id'    => $sale->id,
                    'type'            => 'sale',
                    'quantity'        => -(float) $item->quantity,
                    'before_quantity' => $before,
                    'after_quantity'  => $after,
                    'unit_cost'       => $item->unit_price,
                    'note'            => 'Sale: ' . $sale->reference_no,
                    'created_by'      => Auth::id(),
                ]);

                $this->checkLowStock($product);
            });
        }
    }

    /**
     * Restore stock when a sale is voided (soft deleted).
     * Called in SaleController::destroy().
     */
    public function reverseStock(Sale $sale): void
    {
        foreach ($sale->items as $item) {
            DB::transaction(function () use ($item, $sale) {
                $product = Product::lockForUpdate()->find($item->product_id);
                if (!$product) return;

                if ($item->variant_id) {
                    $variant = ProductVariant::lockForUpdate()->find($item->variant_id);
                    if ($variant) {
                        $before = (float) $variant->stock_qty;
                        $after  = $before + (float) $item->quantity;
                        $variant->stock_qty = $after;
                        $variant->save();
                    }
                } else {
                    $before = (float) $product->stock_qty;
                    $after  = $before + (float) $item->quantity;
                    $product->stock_qty = $after;
                    $product->save();
                }

                StockMovement::create([
                    'product_id'      => $product->id,
                    'variant_id'      => $item->variant_id ?? null,
                    'reference_type'  => Sale::class,
                    'reference_id'    => $sale->id,
                    'type'            => 'return',
                    'quantity'        => (float) $item->quantity,
                    'before_quantity' => $before,
                    'after_quantity'  => $after,
                    'unit_cost'       => $item->unit_price,
                    'note'            => 'Sale voided: ' . $sale->reference_no,
                    'created_by'      => Auth::id(),
                ]);
            });
        }
    }

    /**
     * Re-apply stock when a voided sale is restored.
     * Called in SaleController::restore().
     */
    public function reApplyStock(Sale $sale): void
    {
        foreach ($sale->items as $item) {
            DB::transaction(function () use ($item, $sale) {
                $product = Product::lockForUpdate()->find($item->product_id);
                if (!$product) return;

                if ($item->variant_id) {
                    $variant = ProductVariant::lockForUpdate()->find($item->variant_id);
                    if ($variant) {
                        $before = (float) $variant->stock_qty;
                        $after  = $before - (float) $item->quantity;
                        $variant->stock_qty = $after;
                        $variant->save();
                    }
                } else {
                    $before = (float) $product->stock_qty;
                    $after  = $before - (float) $item->quantity;
                    $product->stock_qty = $after;
                    $product->save();
                }

                StockMovement::create([
                    'product_id'      => $product->id,
                    'variant_id'      => $item->variant_id ?? null,
                    'reference_type'  => Sale::class,
                    'reference_id'    => $sale->id,
                    'type'            => 'sale',
                    'quantity'        => -(float) $item->quantity,
                    'before_quantity' => $before,
                    'after_quantity'  => $after,
                    'unit_cost'       => $item->unit_price,
                    'note'            => 'Sale restored: ' . $sale->reference_no,
                    'created_by'      => Auth::id(),
                ]);

                $this->checkLowStock($product);
            });
        }
    }

    /**
     * Fire LowStockNotification if stock_qty <= low_stock_threshold.
     */
    private function checkLowStock(Product $product): void
    {
        if ($product->low_stock_threshold === null) {
            return;
        }

        if ($product->stock_qty <= $product->low_stock_threshold) {
            $admins = User::role('Admin')->get();

            if ($admins->isNotEmpty()) {
                Notification::send($admins, new LowStockNotification(
                    $product->name,
                    (float) $product->stock_qty,
                    (float) $product->low_stock_threshold,
                    $product->id
                ));
            }
        }
    }
}
