<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_pages', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['privacy_policy', 'terms_conditions'])->unique();
            $table->string('title');
            $table->longText('content')->nullable();
            $table->boolean('is_visible')->default(false);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Seed the two fixed rows so they always exist
        DB::table('legal_pages')->insert([
            [
                'type'       => 'privacy_policy',
                'title'      => 'Privacy Policy',
                'content'    => null,
                'is_visible' => false,
                'updated_by' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'type'       => 'terms_conditions',
                'title'      => 'Terms & Conditions',
                'content'    => null,
                'is_visible' => false,
                'updated_by' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_pages');
    }
};
