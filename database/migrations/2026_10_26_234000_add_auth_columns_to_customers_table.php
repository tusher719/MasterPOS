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
        Schema::table('customers', function (Blueprint $table) {
            $table->string('password')->nullable()->after('email');
            $table->rememberToken()->after('password');
            $table->string('avatar')->nullable()->after('remember_token');
            $table->timestamp('phone_verified_at')->nullable()->after('avatar');
            $table->string('default_delivery_type', 30)->nullable()->default('inside_dhaka')->after('phone_verified_at');

            $table->index('phone');
            $table->index('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['phone']);
            $table->dropIndex(['email']);
            $table->dropColumn([
                'password',
                'remember_token',
                'avatar',
                'phone_verified_at',
                'default_delivery_type',
            ]);
        });
    }
};
