<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\ExpenseCategory;
use App\Models\Investment;
use App\Models\Partner;
use App\Models\ProductCategory;
use App\Models\ProfitDistribution;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Services\CascadeDeleteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DeletePreviewController extends Controller
{
    public function __construct(private CascadeDeleteService $cascade) {}

    /**
     * GET /backend/delete-preview/{type}/{id}
     *
     * Returns a JSON dependency preview for the given entity type + id.
     * The caller shows this in a ConfirmDeleteModal before proceeding.
     */
    public function show(Request $request, string $type, int $id): JsonResponse
    {
        [$model, $permission] = $this->resolveModel($type, $id);

        abort_unless(Gate::allows($permission), 403);

        $preview = $this->cascade->preview($model);

        return response()->json($preview);
    }

    // -------------------------------------------------------------------------

    /**
     * Map URL type slug → [Model instance, required permission].
     */
    private function resolveModel(string $type, int $id): array
    {
        return match ($type) {
            'investment'       => [Investment::findOrFail($id),          'investment.delete'],
            'partner'          => [Partner::findOrFail($id),             'partners.delete'],
            'sale'             => [Sale::findOrFail($id),                'sale.delete'],
            'purchase'         => [Purchase::findOrFail($id),            'purchase.delete'],
            'distribution'     => [ProfitDistribution::findOrFail($id),  'profit_distribution.delete'],
            'category'         => [ProductCategory::findOrFail($id),     'product_category.delete'],
            'unit'             => [Unit::findOrFail($id),                'unit.delete'],
            'expense-category' => [ExpenseCategory::findOrFail($id),     'expense_category.delete'],
            'supplier'         => [Supplier::findOrFail($id),            'supplier.delete'],
            'customer'         => [Customer::findOrFail($id),            'customer.delete'],
            'user'             => [User::findOrFail($id),                'users.delete'],
            default            => abort(404, "Unknown entity type: {$type}"),
        };
    }
}
