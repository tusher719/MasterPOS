<?php

namespace App\Services\Fraud;

use App\Models\FraudFlag;
use App\Models\OrderAttemptLog;
use App\Services\SettingsService;
use Illuminate\Support\Facades\Log;

/**
 * Layer2IpOrderLimitService
 *
 * Enforces a rolling 24-hour IP-based order attempt limit.
 *
 * Flow on every checkout attempt:
 *   1. Log the attempt in order_attempt_logs (was_blocked = false initially)
 *   2. Count how many attempts this IP has made in the last 24 hours
 *   3. If count > limit → update the log row to was_blocked = true,
 *      create a fraud_flag (trigger_type = auto_layer2), return blocked result
 *   4. If count <= limit → return passed result
 *
 * The log row is always written BEFORE the count check so that even the
 * first-over-limit attempt is recorded as blocked.
 *
 * This service is read-only with respect to sales — it never touches
 * the sales table. SaleController calls it before DB::transaction().
 */
class Layer2IpOrderLimitService
{
    public function __construct(
        private readonly Layer1ValidationService $layer1,
    ) {}

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Check whether this IP is within the allowed order attempt limit.
     *
     * Always logs the attempt first, then checks the count.
     * Returns a result array so the controller can decide what to do.
     *
     * @param  string      $ip      Raw IP from $request->ip()
     * @param  string|null $phone   Customer phone (normalized before storage)
     * @param  string|null $name    Customer name snapshot (for fraud_flag record)
     * @param  string|null $address Delivery address snapshot (for fraud_flag record)
     * @return array{passed: bool, message: string|null, flag_id: int|null}
     */
    public function check(
        string  $ip,
        ?string $phone   = null,
        ?string $name    = null,
        ?string $address = null,
    ): array {
        $normalizedPhone = $phone ? $this->layer1->normalizePhone($phone) : null;

        // Always log the attempt — was_blocked updated below if limit exceeded
        $log = OrderAttemptLog::create([
            'ip_address'   => $ip,
            'phone'        => $normalizedPhone,
            'attempted_at' => now(),
            'was_blocked'  => false,
        ]);

        $limit = $this->resolveLimit();
        $count = OrderAttemptLog::scopeRecentByIp(
            OrderAttemptLog::query(), $ip
        )->count();

        if ($count > $limit) {
            // Mark this log row as blocked
            $log->update(['was_blocked' => true]);

            // Auto-create a fraud flag for admin review
            $flagId = $this->createFraudFlag($ip, $normalizedPhone, $name, $address);

            return [
                'passed'  => false,
                'message' => 'ip_limit_exceeded',
                'flag_id' => $flagId,
            ];
        }

        return [
            'passed'  => true,
            'message' => null,
            'flag_id' => null,
        ];
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Read the configured limit from business_settings.
     * Falls back to 3 if the setting is missing or non-numeric.
     */
    private function resolveLimit(): int
    {
        $value = SettingsService::get('fraud_ip_order_limit_per_24h', 3);

        return is_numeric($value) && (int) $value > 0
            ? (int) $value
            : 3;
    }

    /**
     * Create a fraud_flag entry for an auto-blocked IP.
     *
     * flagged_by = null  → system-triggered (as per DATABASE_SCHEMA note)
     * trigger_type       → auto_layer2
     * reason             → ip_limit_exceeded
     * status             → pending_review (admin must confirm or clear)
     *
     * Returns the new FraudFlag id, or null if creation fails (non-fatal).
     */
    private function createFraudFlag(
        string  $ip,
        ?string $phone,
        ?string $name,
        ?string $address,
    ): ?int {
        try {
            $flag = new FraudFlag();
            $flag->fill([
                'customer_id'        => null,
                'phone'              => $phone ?? 'unknown',
                'email'              => null,
                'full_name_snapshot' => $name ?? 'unknown',
                'address_snapshot'   => $address,
                'reason'             => 'ip_limit_exceeded',
                'reason_note'        => "IP {$ip} exceeded the 24-hour order attempt limit.",
                'trigger_type'       => 'auto_layer2',
                'related_sale_ids'   => null,
                'flagged_by'         => null,   // null = system-triggered
                'flagged_at'         => now(),
            ]);

            // status excluded from $fillable — set via forceFill per Rule 66
            $flag->forceFill(['status' => 'pending_review'])->save();

            return $flag->id;
        } catch (\Throwable $e) {
            // Fraud flag failure must never block a legitimate order check result.
            // Log the error and continue — the block result is already decided.
            Log::warning('Layer 2: fraud_flag creation failed', [
                'ip'    => $ip,
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
