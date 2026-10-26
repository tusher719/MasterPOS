<?php

namespace Tests\Feature\Backend;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DashboardManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $guestUser;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Staff']);

        $this->admin = User::factory()->create(['status' => 'active']);
        $this->admin->assignRole('Admin');

        $this->guestUser = User::factory()->create(['status' => 'active']);
    }

    public function test_admin_can_view_dashboard_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.dashboard.index'));
        $response->assertStatus(200);
    }

    public function test_unauthenticated_user_redirected_to_login(): void
    {
        $response = $this->get(route('backend.dashboard.index'));
        $response->assertRedirect(route('login'));
    }

    public function test_admin_can_fetch_dashboard_data_default_period(): void
    {
        $response = $this->actingAs($this->admin)->getJson(route('backend.dashboard.data'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'period' => ['type', 'from', 'to'],
            'financial' => [
                'revenue',
                'today_revenue',
                'expenses',
                'net_profit',
                'sales_count',
                'aov',
                'profit_margin',
            ],
            'sales_analytics' => [
                'payment_breakdown',
                'status_breakdown',
            ],
            'inventory' => [
                'total_inventory_value',
                'total_sku',
                'low_stock_count',
                'out_of_stock_count',
            ],
            'customer_analytics' => ['total', 'new', 'returning'],
            'product_analytics' => ['fast_moving', 'slow_moving', 'highest_profit'],
            'charts' => [
                'granularity',
                'sales_trend',
                'expense_trend',
                'expense_by_category',
            ],
            'recent_sales',
            'top_products',
            'top_customers',
            'low_stock',
            'never_sold',
            'needs_attention',
            'recent_activities',
            'recent_notifications',
        ]);
    }

    public function test_admin_can_fetch_dashboard_data_with_period_filters(): void
    {
        $periods = ['today', 'this_week', 'this_month', 'this_year'];

        foreach ($periods as $period) {
            $response = $this->actingAs($this->admin)->getJson(route('backend.dashboard.data', ['period' => $period]));
            $response->assertStatus(200);
            $response->assertJsonPath('period.type', $period);
        }
    }

    public function test_admin_can_fetch_dashboard_data_with_custom_date_range(): void
    {
        $response = $this->actingAs($this->admin)->getJson(route('backend.dashboard.data', [
            'period'    => 'custom',
            'date_from' => '2026-01-01',
            'date_to'   => '2026-03-31',
        ]));

        $response->assertStatus(200);
        $response->assertJsonPath('period.type', 'custom');
        $response->assertJsonPath('period.from', '2026-01-01');
        $response->assertJsonPath('period.to', '2026-03-31');
    }

    public function test_custom_period_requires_date_from_and_date_to(): void
    {
        $response = $this->actingAs($this->admin)->getJson(route('backend.dashboard.data', [
            'period' => 'custom',
        ]));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['date_from', 'date_to']);
    }
}
