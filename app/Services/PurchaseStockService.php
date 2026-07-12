<?php

// app/Services/PurchaseStockService.php

namespace App\Services;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use App\Models\User;
use App\Notifications\LowStockNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class PurchaseStockService
{
    // ─── Apply Stock ──────────────────────────────────────────────────────────
    // Called when purchase status becomes received/partial_received

    public function applyStock(Purchase $purchase): void
    {
        foreach ($purchase->items as $item) {
            $product = Product::lockForUpdate()->find($item->product_id);

            if (!$product) {
                continue;
            }

            $beforeQty = (int) ($product->stock_qty ?? 0);
            $afterQty  = $beforeQty + $item->quantity;

            // Update product stock
            $product->stock_qty           = $afterQty;
            $product->last_purchase_price = $item->unit_cost;
            $product->average_cost        = $this->calculateAverageCost(
                $beforeQty,
                (float) ($product->average_cost ?? 0),
                $item->quantity,
                $item->unit_cost
            );
            $product->save();

            // Log stock movement
            $this->logMovement(
                product:         $product,
                purchase:        $purchase,
                type:            'purchase',
                quantity:        $item->quantity,   // positive = IN
                beforeQty:       $beforeQty,
                afterQty:        $afterQty,
                unitCost:        $item->unit_cost,
                note:            "Stock in via purchase {$purchase->reference_no}"
            );

            // Check low stock threshold
            $this->checkLowStock($product);
        }
    }

    // ─── Reverse Stock ────────────────────────────────────────────────────────
    // Called when a previously stock-applied purchase is edited,
    // soft deleted, or status changed away from received/partial_received

    public function reverseStock(Purchase $purchase): void
    {
        foreach ($purchase->items as $item) {
            $product = Product::lockForUpdate()->find($item->product_id);

            if (!$product) {
                continue;
            }

            $beforeQty = (int) ($product->stock_qty ?? 0);
            $afterQty  = max(0, $beforeQty - $item->quantity); // never go below 0

            // Update product stock
            $product->stock_qty = $afterQty;
            $product->save();

            // Log stock movement (negative quantity = OUT)
            $this->logMovement(
                product:   $product,
                purchase:  $purchase,
                type:      'adjustment',
                quantity:  -$item->quantity,         // negative = OUT
                beforeQty: $beforeQty,
                afterQty:  $afterQty,
                unitCost:  $item->unit_cost,
                note:      "Stock reversed for purchase {$purchase->reference_no}"
            );

            // Check low stock threshold after reversal
            $this->checkLowStock($product);
        }
    }

    // ─── Sync Stock on Update ─────────────────────────────────────────────────
    // Called during purchase update to handle item-level stock diff
    // oldItems: collection of PurchaseItem before update
    // newItems: array of validated item data after update

    public function syncStock(
        Purchase   $purchase,
        Collection $oldItems,
        array      $newItems,
        string     $oldStatus,
        string     $newStatus
    ): void {
        $wasStockApplied = $purchase->triggersStock()
            ? in_array($oldStatus, Purchase::STOCK_TRIGGER_STATUSES)
            : false;

        $willApplyStock = in_array($newStatus, Purchase::STOCK_TRIGGER_STATUSES);

        if (!$wasStockApplied && !$willApplyStock) {
            // Neither old nor new status triggers stock — nothing to do
            return;
        }

        if ($wasStockApplied && !$willApplyStock) {
            // Status changed away from stock-trigger — reverse all old stock
            $this->reverseStock($purchase);
            return;
        }

        if (!$wasStockApplied && $willApplyStock) {
            // Status changed into stock-trigger — apply new stock after items saved
            return; // caller must call applyStock() after saving new items
        }

        // Both old and new statuses trigger stock — diff item by item
        $oldMap = $oldItems->keyBy('product_id');
        $newMap = collect($newItems)->keyBy('product_id');

        $allProductIds = $oldMap->keys()->merge($newMap->keys())->unique();

        foreach ($allProductIds as $productId) {
            $product = Product::lockForUpdate()->find($productId);

            if (!$product) {
                continue;
            }

            $oldQty = $oldMap->has($productId)
                ? (int) $oldMap[$productId]->quantity
                : 0;

            $newQty = $newMap->has($productId)
                ? (int) $newMap[$productId]['quantity']
                : 0;

            $diff = $newQty - $oldQty;

            if ($diff === 0) {
                continue; // no change for this product
            }

            $beforeQty = (int) ($product->stock_qty ?? 0);
            $afterQty  = max(0, $beforeQty + $diff);

            $product->stock_qty = $afterQty;

            // Update cost fields only if adding stock
            if ($diff > 0 && $newMap->has($productId)) {
                $unitCost = (float) $newMap[$productId]['unit_cost'];
                $product->last_purchase_price = $unitCost;
                $product->average_cost        = $this->calculateAverageCost(
                    $beforeQty,
                    (float) ($product->average_cost ?? 0),
                    $diff,
                    $unitCost
                );
            }

            $product->save();

            $this->logMovement(
                product:   $product,
                purchase:  $purchase,
                type:      $diff > 0 ? 'purchase' : 'adjustment',
                quantity:  $diff,
                beforeQty: $beforeQty,
                afterQty:  $afterQty,
                unitCost:  $newMap->has($productId)
                               ? (float) $newMap[$productId]['unit_cost']
                               : null,
                note: "Stock adjusted via purchase update {$purchase->reference_no}"
            );

            $this->checkLowStock($product);
        }
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private function calculateAverageCost(
        int   $currentStock,
        float $currentAvgCost,
        int   $incomingQty,
        float $incomingCost
    ): float {
        $totalQty = $currentStock + $incomingQty;

        if ($totalQty <= 0) {
            return $incomingCost;
        }

        return round(
            (($currentStock * $currentAvgCost) + ($incomingQty * $incomingCost)) / $totalQty,
            2
        );
    }

    private function logMovement(
        Product  $product,
        Purchase $purchase,
        string   $type,
        int      $quantity,
        int      $beforeQty,
        int      $afterQty,
        ?float   $unitCost,
        string   $note
    ): void {
        StockMovement::create([
            'product_id'      => $product->id,
            'reference_type'  => Purchase::class,
            'reference_id'    => $purchase->id,
            'type'            => $type,
            'quantity'        => $quantity,
            'before_quantity' => $beforeQty,
            'after_quantity'  => $afterQty,
            'unit_cost'       => $unitCost,
            'note'            => $note,
            'created_by'      => Auth::id(),
        ]);
    }

    private function checkLowStock(Product $product): void
    {
        // low_stock_threshold = 0 means threshold not set — skip
        if (!$product->low_stock_threshold || $product->low_stock_threshold <= 0) {
            return;
        }

        if ($product->stock_qty <= $product->low_stock_threshold) {
            // Notify all admin users
            $admins = User::role('Admin')->get();

            Notification::send($admins, new LowStockNotification(
                $product->name,
                (float) $product->stock_qty,
                (float) $product->low_stock_threshold,
                $product->id
            ));
        }
    }
}
