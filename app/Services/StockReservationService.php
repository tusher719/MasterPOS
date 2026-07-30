<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockReservation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StockReservationService
{
    /**
     * Reserve stock for a storefront order before payment is verified.
     *
     * Returns the created StockReservation on success.
     * Throws \RuntimeException if insufficient stock is available.
     *
     * @param  int        $productId
     * @param  int|null   $variantId
     * @param  float      $quantity
     * @return StockReservation
     *
     * @throws \RuntimeException
     */
    public function reserve(int $productId, ?int $variantId, float $quantity): StockReservation
    {
        return DB::transaction(function () use ($productId, $variantId, $quantity) {

            $windowMinutes = (int) \App\Models\BusinessSetting::getValue(
                'stock_reservation_minutes',
                30
            );

            if ($variantId) {
                $variant = ProductVariant::lockForUpdate()->findOrFail($variantId);

                $reservedQty = $this->getActiveReservedQty(
                    productId: $productId,
                    variantId: $variantId,
                );

                $available = (float) $variant->stock_qty - $reservedQty;

                if ($available < $quantity) {
                    throw new \RuntimeException(
                        "Insufficient stock. Available: {$available}, Requested: {$quantity}."
                    );
                }
            } else {
                $product = Product::lockForUpdate()->findOrFail($productId);

                $reservedQty = $this->getActiveReservedQty(
                    productId: $productId,
                    variantId: null,
                );

                $available = (float) $product->stock_qty - $reservedQty;

                if ($available < $quantity) {
                    throw new \RuntimeException(
                        "Insufficient stock. Available: {$available}, Requested: {$quantity}."
                    );
                }
            }

            return StockReservation::create([
                'product_id'     => $productId,
                'variant_id'     => $variantId,
                'sale_id'        => null,
                'quantity'       => $quantity,
                'reserved_until' => now()->addMinutes($windowMinutes),
                'status'         => 'active',
            ]);
        });
    }

    /**
     * Convert a reservation to a real sale after payment is verified.
     * Marks reservation as converted — actual stock deduction is handled
     * by SaleStockService::applyStock() as normal.
     *
     * @param  int  $reservationId
     * @param  int  $saleId
     * @return void
     */
    public function convertToSale(int $reservationId, int $saleId): void
    {
        DB::transaction(function () use ($reservationId, $saleId) {
            $reservation = StockReservation::lockForUpdate()->findOrFail($reservationId);

            if ($reservation->status !== 'active') {
                throw new \RuntimeException(
                    "Reservation #{$reservationId} is not active (status: {$reservation->status})."
                );
            }

            $reservation->markConverted($saleId);
        });
    }

    /**
     * Manually release a reservation (e.g. customer cancelled before payment window).
     *
     * @param  int  $reservationId
     * @return void
     */
    public function release(int $reservationId): void
    {
        DB::transaction(function () use ($reservationId) {
            $reservation = StockReservation::lockForUpdate()->findOrFail($reservationId);

            if ($reservation->status !== 'active') {
                // Already expired or converted — nothing to do
                return;
            }

            $reservation->markReleased();
        });
    }

    /**
     * Sweep all active reservations past their reserved_until window.
     * Called by SweepExpiredReservations artisan command.
     *
     * Processes in chunks to avoid memory exhaustion on large tables.
     *
     * @return int  Number of reservations expired in this sweep.
     */
    public function sweepExpired(): int
    {
        $count = 0;

        StockReservation::expired()
            ->chunkById(100, function ($reservations) use (&$count) {
                foreach ($reservations as $reservation) {
                    try {
                        DB::transaction(function () use ($reservation) {
                            // Re-fetch with lock inside transaction
                            $fresh = StockReservation::lockForUpdate()->find($reservation->id);

                            // Guard: another process may have converted it
                            if (!$fresh || $fresh->status !== 'active') {
                                return;
                            }

                            $fresh->markExpired();
                        });

                        $count++;
                    } catch (\Throwable $e) {
                        Log::error('StockReservationService::sweepExpired failed for reservation #' . $reservation->id, [
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            });

        return $count;
    }

    // ------------------------------------------------------------------ //
    // Private helpers
    // ------------------------------------------------------------------ //

    /**
     * Sum of quantity currently reserved (active, not expired) for a
     * given product/variant combination.
     *
     * Must be called inside a lockForUpdate() transaction so the
     * aggregate is consistent with the stock read above it.
     */
    private function getActiveReservedQty(int $productId, ?int $variantId): float
    {
        return (float) StockReservation::where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->where('status', 'active')
            ->where('reserved_until', '>', now())
            ->sum('quantity');
    }
}
