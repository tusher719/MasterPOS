<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('storefront_banners', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('title', 150);
            $table->text('subtitle')->nullable();
            $table->string('badge_text', 60)->nullable();
            $table->string('image_path', 255);
            $table->string('link_url', 255)->nullable();
            $table->string('button_text', 60)->nullable()->default('Shop Now');
            $table->string('coupon_code', 50)->nullable()->index();
            $table->string('placement', 30)->default('hero_slider')->index(); // hero_slider, promo_strip, popup_banner
            $table->string('bg_color', 30)->nullable()->default('#111827');
            $table->integer('sort_order')->default(0)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['placement', 'is_active', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('storefront_banners');
    }
};
