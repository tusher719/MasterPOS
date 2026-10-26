<?php

namespace Tests\Feature\Backend;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FinanceManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $unauthorizedUser;
    protected ExpenseCategory $category;
    protected PaymentMethod $paymentMethod;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Staff']);

        $this->admin = User::factory()->create(['status' => 'active']);
        $this->admin->assignRole('Admin');

        $this->unauthorizedUser = User::factory()->create(['status' => 'active']);

        $this->category = ExpenseCategory::firstOrCreate(
            ['name' => 'Office Utilities'],
            ['is_active' => true]
        );

        $this->paymentMethod = PaymentMethod::firstOrCreate(
            ['name' => 'Cash on Counter'],
            ['is_active' => true]
        );
    }

    public function test_admin_can_view_expenses_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.expenses.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_create_expense_with_uuid(): void
    {
        $payload = [
            'expense_category_id' => $this->category->id,
            'payment_method_id'   => $this->paymentMethod->id,
            'title'               => 'Monthly High-Speed Internet Bill',
            'amount'              => 3500.00,
            'expense_date'        => now()->toDateString(),
            'reference'           => 'ISP-BILL-202610',
            'note'                => 'Fiber optic line payment',
        ];

        $response = $this->actingAs($this->admin)->post(route('backend.expenses.store'), $payload);
        $response->assertRedirect();

        $expense = Expense::where('reference', 'ISP-BILL-202610')->first();
        $this->assertNotNull($expense);
        $this->assertNotNull($expense->uuid);
        $this->assertStringStartsWith('EX-', $expense->reference_no);
        $this->assertEquals(3500.00, (float) $expense->amount);
    }

    public function test_admin_can_update_expense(): void
    {
        $expense = Expense::create([
            'expense_category_id' => $this->category->id,
            'payment_method_id'   => $this->paymentMethod->id,
            'title'               => 'Initial Office Supplies',
            'amount'              => 1200.00,
            'expense_date'        => now()->toDateString(),
            'reference_no'        => Expense::generateReference(),
            'created_by'          => $this->admin->id,
        ]);

        $payload = [
            'expense_category_id' => $this->category->id,
            'payment_method_id'   => $this->paymentMethod->id,
            'title'               => 'Updated Office Supplies & Stationery',
            'amount'              => 1500.00,
            'expense_date'        => now()->toDateString(),
        ];

        $response = $this->actingAs($this->admin)->put(route('backend.expenses.update', $expense), $payload);
        $response->assertRedirect();

        $expense->refresh();
        $this->assertEquals('Updated Office Supplies & Stationery', $expense->title);
        $this->assertEquals(1500.00, (float) $expense->amount);
    }

    public function test_admin_can_soft_delete_and_restore_expense(): void
    {
        $expense = Expense::create([
            'expense_category_id' => $this->category->id,
            'payment_method_id'   => $this->paymentMethod->id,
            'title'               => 'Temporary Cleaning Service',
            'amount'              => 800.00,
            'expense_date'        => now()->toDateString(),
            'reference_no'        => Expense::generateReference(),
            'created_by'          => $this->admin->id,
        ]);

        // Soft delete
        $response = $this->actingAs($this->admin)->delete(route('backend.expenses.destroy', $expense));
        $response->assertRedirect();

        $this->assertSoftDeleted('expenses', ['id' => $expense->id]);

        // Restore
        $restoreResponse = $this->actingAs($this->admin)->post(route('backend.expenses.restore', $expense->id));
        $restoreResponse->assertRedirect();

        $this->assertNotSoftDeleted('expenses', ['id' => $expense->id]);
    }

    public function test_unauthorized_user_cannot_create_expense(): void
    {
        $payload = [
            'expense_category_id' => $this->category->id,
            'payment_method_id'   => $this->paymentMethod->id,
            'title'               => 'Unauthorized Expense Entry',
            'amount'              => 5000.00,
            'expense_date'        => now()->toDateString(),
        ];

        $response = $this->actingAs($this->unauthorizedUser)->post(route('backend.expenses.store'), $payload);
        $response->assertStatus(403);
    }
}
