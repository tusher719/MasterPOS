<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates order_attempt_logs table for Layer 2 IP-based fraud detection.
     * Every checkout attempt (POS + storefront) logs one row here.
     * Layer 2 counts rows per IP in the last 24 hours — if it exceeds the
     * configured limit, the order is auto-blocked and a fraud_flag is created.
     *
     * Also seeds the two Layer 2 business_settings keys:
     *   fraud_ip_order_limit_per_24h  — max allowed attempts per IP per 24h (default 3)
     *   fraud_block_message           — customer-facing blocked message (default BD text)
     *   fraud_contact_whatsapp        — optional WhatsApp number shown on block popup
     *   fraud_contact_phone           — optional call number shown on block popup
     *   fraud_contact_facebook        — optional Facebook URL shown on block popup
     *
     * Note: fraud_block_message and contact fields are shared with Layer 3 (6.4/6.5)
     * and are seeded here once to avoid duplicating them in later migrations.
     */
    public function up(): void
    {
        // ── order_attempt_logs ─────────────────────────────────────────────────
        Schema::create('order_attempt_logs', function (Blueprint $table) {
            $table->id();

            // IP address of the request — IPv4 or IPv6 (max 45 chars covers both)
            $table->string('ip_address', 45);

            // Normalized phone (01XXXXXXXXX format) — nullable because POS
            // walk-in without a phone bypasses phone checks but still logs the IP
            $table->string('phone', 20)->nullable();

            // Timestamp of the attempt — used in the 24-hour window query
            $table->timestamp('attempted_at')->useCurrent();

            // True when this attempt was blocked by Layer 2 (IP limit exceeded)
            // False when the attempt passed through (even if Layer 1 rejected it)
            $table->boolean('was_blocked')->default(false);

            $table->timestamps();

            // Index on ip_address + attempted_at — the only query pattern used:
            //   WHERE ip_address = ? AND attempted_at >= NOW() - INTERVAL 24 HOUR
            $table->index(['ip_address', 'attempted_at']);

            // Index on phone for future Layer 3 phone-based queries
            $table->index('phone');
        });

        // ── business_settings seed — Layer 2 + block popup keys ───────────────
        // Insert only when the key does not already exist, so re-running the
        // migration (e.g. after a rollback) does not duplicate rows.
        $settings = [
            // Max order attempts per IP within any rolling 24-hour window.
            // Exceeding this triggers an auto-block + fraud_flag (auto_layer2).
            [
                'key'   => 'fraud_ip_order_limit_per_24h',
                'value' => '3',
            ],

            // Customer-facing message shown on the order-blocked popup (Item 6.5).
            // Default is in Bengali — admin can customise from Settings UI.
            [
                'key'   => 'fraud_block_message',
                'value' => 'আপনার অর্ডারটি সাময়িকভাবে গ্রহণ করা সম্ভব হচ্ছে না। বিস্তারিত জানতে আমাদের সাথে যোগাযোগ করুন।',
            ],

            // Optional contact links shown on the block popup (Item 6.5).
            // Left empty by default — admin fills them in Settings.
            ['key' => 'fraud_contact_whatsapp', 'value' => null],
            ['key' => 'fraud_contact_phone',     'value' => null],
            ['key' => 'fraud_contact_facebook',  'value' => null],
        ];

        foreach ($settings as $setting) {
            DB::table('business_settings')
                ->where('key', $setting['key'])
                ->exists() || DB::table('business_settings')->insert([
                    'key'        => $setting['key'],
                    'value'      => $setting['value'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     *
     * Drops the table and removes the seeded settings keys.
     * Does NOT touch fraud_block_message or contact keys if they were already
     * present before this migration ran — but since we only insert when absent,
     * a clean rollback is safe.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_attempt_logs');

        DB::table('business_settings')
            ->whereIn('key', [
                'fraud_ip_order_limit_per_24h',
                'fraud_block_message',
                'fraud_contact_whatsapp',
                'fraud_contact_phone',
                'fraud_contact_facebook',
            ])
            ->delete();
    }
};
