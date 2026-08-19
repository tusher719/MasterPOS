<?php

namespace App\Services\Fraud;

use App\Models\FraudFlag;
use App\Models\Sale;
use App\Services\SettingsService;
use Illuminate\Support\Facades\Log;

class Layer3SuccessRatioService
{
    /**
     * Check the success ratio for a given phone number.
     *
     * Success ratio = delivered orders / total orders for this phone.
     * Block condition: ratio < threshold AND total orders >= min_orders_before_check.
     *
     * Runs AFTER Layer 1 + Layer 2 pass — only real phones reach here.
     * Returns ['passed' => true] or ['passed' => false, 'message' => '...'].
     */
    public function check(string $phone): array
    {
        $normalized = $this->normalizePhone($phone);

        if ($normalized === null) {
            // Unrecognized format — Layer 1 should have caught this.
            // Fail open so a format edge case never blocks a real customer.
            return ['passed' => true];
        }

        $minOrders = $this->resolveMinOrders();
        $threshold = $this->resolveThreshold();

        // Count all non-voided orders for this phone number.
        // Matches against both registered customer phone and
        // delivery_contact_phone (walk-in customers).
        $totalOrders = $this->countTotalOrders($normalized);

        // Not enough order history — skip the ratio check entirely.
        if ($totalOrders < $minOrders) {
            return ['passed' => true];
        }

        $deliveredOrders = $this->countDeliveredOrders($normalized);

        // Integer division safe: totalOrders >= minOrders >= 1 here.
        $ratio = (int) round(($deliveredOrders / $totalOrders) * 100);

        if ($ratio < $threshold) {
            $this->createFraudFlag($normalized, $totalOrders, $deliveredOrders, $ratio);

            return [
                'passed'  => false,
                'message' => 'low_success_ratio',
            ];
        }

        return ['passed' => true];
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Count all non-voided sales tied to this phone.
     * Checks both registered customer phone and walk-in delivery_contact_phone.
     */
    private function countTotalOrders(string $phone): int
    {
        return (int) Sale::whereNull('deleted_at')
            ->where(function ($q) use ($phone) {
                $q->whereHas('customer', fn($cq) => $cq->where('phone', $phone))
                  ->orWhere('delivery_contact_phone', $phone);
            })
            ->count();
    }

    /**
     * Count delivered orders for this phone.
     * order_status = 'delivered' is the only terminal success state.
     */
    private function countDeliveredOrders(string $phone): int
    {
        return (int) Sale::whereNull('deleted_at')
            ->where('order_status', 'delivered')
            ->where(function ($q) use ($phone) {
                $q->whereHas('customer', fn($cq) => $cq->where('phone', $phone))
                  ->orWhere('delivery_contact_phone', $phone);
            })
            ->count();
    }

    /**
     * Normalize phone to local 11-digit Bangladeshi format (01XXXXXXXXX).
     * Strips +88 and 88 country code prefixes.
     * Returns null if the format is unrecognizable after stripping.
     */
    private function normalizePhone(string $phone): ?string
    {
        $cleaned = preg_replace('/\s+/', '', $phone);

        if (str_starts_with($cleaned, '+88')) {
            $cleaned = substr($cleaned, 3);
        } elseif (str_starts_with($cleaned, '88') && strlen($cleaned) === 13) {
            $cleaned = substr($cleaned, 2);
        }

        // Must be 11 digits starting with 01[3-9]
        if (preg_match('/^01[3-9]\d{8}$/', $cleaned)) {
            return $cleaned;
        }

        return null;
    }

    /**
     * Read fraud_success_ratio_threshold from settings.
     * Default: 60 (percent).
     */
    private function resolveThreshold(): int
    {
        return (int) (SettingsService::get('fraud_success_ratio_threshold', 60));
    }

    /**
     * Read fraud_min_orders_before_check from settings.
     * Default: 3 orders minimum before ratio check activates.
     */
    private function resolveMinOrders(): int
    {
        return (int) (SettingsService::get('fraud_min_orders_before_check', 3));
    }

    /**
     * Create a fraud flag for auto_layer3 trigger.
     * Non-fatal — flag creation failure must not block the order decision.
     * flagged_by = null means system-triggered (same pattern as Layer 2).
     */
    private function createFraudFlag(
        string $phone,
        int    $totalOrders,
        int    $deliveredOrders,
        int    $ratio
    ): void {
        try {
            $flag = new FraudFlag();
            $flag->forceFill([
                'phone'                => $phone,
                'email'                => null,
                'full_name_snapshot'   => 'Unknown',
                'address_snapshot'     => null,
                'reason'               => 'low_success_ratio',
                'reason_note'          => "Auto-blocked by Layer 3: {$deliveredOrders}/{$totalOrders} orders delivered ({$ratio}% success ratio).",
                'trigger_type'         => 'auto_layer3',
                'related_sale_ids'     => null,
                'status'               => 'pending_review',
                'flagged_by'           => null,
                'flagged_at'           => now(),
            ])->save();
        } catch (\Throwable $e) {
            Log::warning('Layer 3 fraud flag creation failed for phone: ' . $phone, [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
