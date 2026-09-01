<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quick_links', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('icon');                          // lucide-react icon name e.g. "Package"
            $table->string('route_name');                    // Laravel named route e.g. "backend.products.index"
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('visible_to_roles')->nullable();    // null = visible to everyone
            $table->timestamps();
        });

        // Seed default quick links
        $now = now();
        DB::table('quick_links')->insert([
            [
                'label'           => 'Products',
                'icon'            => 'Package',
                'route_name'      => 'backend.products.index',
                'sort_order'      => 1,
                'is_active'       => true,
                'visible_to_roles'=> null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'label'           => 'Customers',
                'icon'            => 'Users',
                'route_name'      => 'backend.customers.index',
                'sort_order'      => 2,
                'is_active'       => true,
                'visible_to_roles'=> null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'label'           => 'Sales History',
                'icon'            => 'ShoppingBag',
                'route_name'      => 'backend.pos.sales.index',
                'sort_order'      => 3,
                'is_active'       => true,
                'visible_to_roles'=> null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'label'           => 'Investments',
                'icon'            => 'TrendingUp',
                'route_name'      => 'backend.investments.index',
                'sort_order'      => 4,
                'is_active'       => true,
                'visible_to_roles'=> null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'label'           => 'Reports',
                'icon'            => 'BarChart3',
                'route_name'      => 'backend.reports.index',
                'sort_order'      => 5,
                'is_active'       => true,
                'visible_to_roles'=> null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'label'           => 'Notifications',
                'icon'            => 'Bell',
                'route_name'      => 'backend.notifications.index',
                'sort_order'      => 6,
                'is_active'       => true,
                'visible_to_roles'=> null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'label'           => 'Expenses',
                'icon'            => 'Receipt',
                'route_name'      => 'backend.expenses.index',
                'sort_order'      => 7,
                'is_active'       => true,
                'visible_to_roles'=> null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('quick_links');
    }
};
