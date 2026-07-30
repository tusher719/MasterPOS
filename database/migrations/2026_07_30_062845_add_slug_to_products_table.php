<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('slug')->unique()->nullable()->after('name');
        });

        // Backfill slugs for existing products
        DB::table('products')->orderBy('id')->each(function ($product) {
            $base = Str::slug($product->name);
            $suffix = Str::lower(Str::random(6));
            $slug = $base . '-' . $suffix;

            // Ensure uniqueness (extremely unlikely collision but guard anyway)
            while (DB::table('products')->where('slug', $slug)->exists()) {
                $suffix = Str::lower(Str::random(6));
                $slug = $base . '-' . $suffix;
            }

            DB::table('products')->where('id', $product->id)->update(['slug' => $slug]);
        });

        // Now make it non-nullable after backfill
        Schema::table('products', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};
