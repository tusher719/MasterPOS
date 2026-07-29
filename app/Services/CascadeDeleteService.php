<?php

namespace App\Services;

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
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class CascadeDeleteService
{
    // -------------------------------------------------------------------------
    // Financial entities — SOFT DELETE ONLY, never hard delete
    // -------------------------------------------------------------------------
    private const FINANCIAL_ENTITIES = [
        Investment::class,
        Partner::class,
        Sale::class,
        Purchase::class,
        ProfitDistribution::class,
    ];

    // -------------------------------------------------------------------------
    // Non-financial entities — hard delete allowed ONLY when no dependants
    // -------------------------------------------------------------------------
    private const FORCE_DELETABLE = [
        ProductCategory::class,
        Unit::class,
        ExpenseCategory::class,
    ];

    // =========================================================================
    // Public API
    // =========================================================================

    /**
     * Return true when the given model class is a financial entity
     * that must never be hard deleted.
     */
    public function isFinancialEntity(string $modelClass): bool
    {
        return in_array($modelClass, self::FINANCIAL_ENTITIES, true);
    }

    /**
     * Return true when the given model class supports force delete
     * (only when there are no dependants).
     */
    public function isForceDeletable(string $modelClass): bool
    {
        return in_array($modelClass, self::FORCE_DELETABLE, true);
    }

    /**
     * Build a human-readable dependency preview for a model before deletion.
     *
     * Returns an array shaped:
     * [
     *   'can_delete'   => bool,
     *   'entity_label' => string,
     *   'dependencies' => [
     *       ['label' => 'Sales', 'count' => 4, 'blocking' => false],
     *       ...
     *   ],
     *   'warnings'     => string[],
     * ]
     */
    public function preview(Model $model): array
    {
        $class = get_class($model);

        return match (true) {
            $model instanceof Investment        => $this->previewInvestment($model),
            $model instanceof Partner           => $this->previewPartner($model),
            $model instanceof Sale              => $this->previewSale($model),
            $model instanceof Purchase          => $this->previewPurchase($model),
            $model instanceof ProfitDistribution => $this->previewDistribution($model),
            $model instanceof ProductCategory   => $this->previewProductCategory($model),
            $model instanceof Unit              => $this->previewUnit($model),
            $model instanceof ExpenseCategory   => $this->previewExpenseCategory($model),
            $model instanceof Supplier          => $this->previewSupplier($model),
            $model instanceof Customer          => $this->previewCustomer($model),
            $model instanceof User              => $this->previewUser($model),
            default => $this->genericPreview($model, $class),
        };
    }

    /**
     * Perform a safe soft delete.
     * Financial entities: always soft delete.
     * Non-financial: soft delete (hard delete handled separately by caller).
     *
     * Throws \RuntimeException if the model does not use SoftDeletes.
     */
    public function softDelete(Model $model): void
    {
        if (! method_exists($model, 'trashed')) {
            throw new \RuntimeException(
                get_class($model) . ' does not use SoftDeletes and cannot be soft-deleted.'
            );
        }

        $model->delete(); // triggers soft delete via SoftDeletes trait
    }

    // =========================================================================
    // Entity-specific previews
    // =========================================================================

    private function previewInvestment(Investment $model): array
    {
        $ledgerCount        = $model->capitalLedgerEntries()->count();
        $distributionItems  = $model->profitDistributionItems()->count();
        $capitalBalance     = $model->capitalBalance()->exists();
        $profitBalance      = $model->profitBalance()->exists();
        $partnerLinks       = $model->partnerInvestments()->count();

        $deps = [];

        if ($ledgerCount > 0) {
            $deps[] = $this->dep('Capital Ledger Entries', $ledgerCount, false);
        }
        if ($distributionItems > 0) {
            $deps[] = $this->dep('Profit Distribution Items', $distributionItems, false);
        }
        if ($capitalBalance) {
            $deps[] = $this->dep('Capital Balance Record', 1, false);
        }
        if ($profitBalance) {
            $deps[] = $this->dep('Investor Profit Balance', 1, false);
        }
        if ($partnerLinks > 0) {
            $deps[] = $this->dep('Partner Links', $partnerLinks, false);
        }

        return [
            'can_delete'   => true, // always allowed — soft delete only
            'entity_label' => 'Investment: ' . $model->title,
            'dependencies' => $deps,
            'warnings'     => $this->financialWarnings('investment'),
        ];
    }

    private function previewPartner(Partner $model): array
    {
        $investments       = $model->investments()->count();
        $profitRules       = $model->profitRules()->count();
        $distributions     = $model->profitDistributionItems()->count();
        $eligibilities     = $model->eligibilities()->count();
        $settlements       = $model->settlementConfigs()->count();
        $assignments       = $model->productAssignments()->count();
        $profitBalance     = $model->profitBalance()->exists();
        $capitalEntries    = $model->capitalLedgerEntries()->count();

        $deps = [];
        if ($investments > 0) {
            $deps[] = $this->dep('Linked Investments', $investments, false);
        }
        if ($profitRules > 0) {
            $deps[] = $this->dep('Profit Rules', $profitRules, false);
        }
        if ($distributions > 0) {
            $deps[] = $this->dep('Distribution Items', $distributions, false);
        }
        if ($eligibilities > 0) {
            $deps[] = $this->dep('Eligibility Records', $eligibilities, false);
        }
        if ($settlements > 0) {
            $deps[] = $this->dep('Settlement Configs', $settlements, false);
        }
        if ($assignments > 0) {
            $deps[] = $this->dep('Product Assignments', $assignments, false);
        }
        if ($profitBalance) {
            $deps[] = $this->dep('Profit Balance Record', 1, false);
        }
        if ($capitalEntries > 0) {
            $deps[] = $this->dep('Capital Ledger Entries', $capitalEntries, false);
        }

        return [
            'can_delete'   => true,
            'entity_label' => 'Partner: ' . $model->name,
            'dependencies' => $deps,
            'warnings'     => $this->financialWarnings('partner'),
        ];
    }

    private function previewSale(Sale $model): array
    {
        $items        = $model->saleItems()->count();
        $payments     = $model->salePayments()->count();
        $holdLinked   = false; // hold_orders linked via session, not FK

        $deps = [];
        if ($items > 0) {
            $deps[] = $this->dep('Sale Items', $items, false);
        }
        if ($payments > 0) {
            $deps[] = $this->dep('Payment Records', $payments, false);
        }

        return [
            'can_delete'   => true,
            'entity_label' => 'Sale: ' . $model->reference_no,
            'dependencies' => $deps,
            'warnings'     => array_merge(
                $this->financialWarnings('sale'),
                ['Stock will be automatically reversed on delete.']
            ),
        ];
    }

    private function previewPurchase(Purchase $model): array
    {
        $items    = $model->purchaseItems()->count();
        $payments = $model->purchasePayments()->count();

        $deps = [];
        if ($items > 0) {
            $deps[] = $this->dep('Purchase Items', $items, false);
        }
        if ($payments > 0) {
            $deps[] = $this->dep('Payment Records', $payments, false);
        }

        return [
            'can_delete'   => true,
            'entity_label' => 'Purchase: ' . $model->reference_no,
            'dependencies' => $deps,
            'warnings'     => array_merge(
                $this->financialWarnings('purchase'),
                ['Stock will be automatically reversed on delete.']
            ),
        ];
    }

    private function previewDistribution(ProfitDistribution $model): array
    {
        $items    = $model->items()->count();
        $payments = $model->items()->withCount('payments')->get()->sum('payments_count');

        $isLocked = (bool) $model->is_locked;

        $deps = [];
        if ($items > 0) {
            $deps[] = $this->dep('Distribution Items', $items, false);
        }
        if ($payments > 0) {
            $deps[] = $this->dep('Payment Records', $payments, false);
        }

        $warnings = $this->financialWarnings('profit distribution');
        if ($isLocked) {
            $warnings[] = 'This distribution is locked (approved/distributed). It must be reversed before deletion.';
        }

        return [
            'can_delete'   => ! $isLocked,
            'entity_label' => 'Distribution: ' . $model->distribution_no,
            'dependencies' => $deps,
            'warnings'     => $warnings,
        ];
    }

    private function previewProductCategory(ProductCategory $model): array
    {
        $products  = $model->products()->withTrashed()->count();
        $children  = $model->children()->withTrashed()->count();

        $blocking = $products > 0 || $children > 0;

        $deps = [];
        if ($products > 0) {
            $deps[] = $this->dep('Products', $products, true);
        }
        if ($children > 0) {
            $deps[] = $this->dep('Sub-categories', $children, true);
        }

        return [
            'can_delete'   => ! $blocking,
            'entity_label' => 'Category: ' . $model->name,
            'dependencies' => $deps,
            'warnings'     => $blocking
                ? ['Cannot delete: reassign or delete products and sub-categories first.']
                : [],
        ];
    }

    private function previewUnit(Unit $model): array
    {
        $products = $model->products()->withTrashed()->count();

        $deps = [];
        if ($products > 0) {
            $deps[] = $this->dep('Products using this unit', $products, true);
        }

        return [
            'can_delete'   => $products === 0,
            'entity_label' => 'Unit: ' . $model->name,
            'dependencies' => $deps,
            'warnings'     => $products > 0
                ? ['Cannot delete: reassign products to a different unit first.']
                : [],
        ];
    }

    private function previewExpenseCategory(ExpenseCategory $model): array
    {
        $expenses = $model->expenses()->withTrashed()->count();

        $deps = [];
        if ($expenses > 0) {
            $deps[] = $this->dep('Expenses', $expenses, true);
        }

        return [
            'can_delete'   => $expenses === 0,
            'entity_label' => 'Expense Category: ' . $model->name,
            'dependencies' => $deps,
            'warnings'     => $expenses > 0
                ? ['Cannot delete: category has expense records.']
                : [],
        ];
    }

    private function previewSupplier(Supplier $model): array
    {
        $purchases = $model->purchases()->withTrashed()->count();

        $deps = [];
        if ($purchases > 0) {
            $deps[] = $this->dep('Purchase Records', $purchases, false);
        }

        return [
            'can_delete'   => true, // soft delete; purchases preserved
            'entity_label' => 'Supplier: ' . $model->name,
            'dependencies' => $deps,
            'warnings'     => $purchases > 0
                ? ['Purchase history will be preserved after supplier is deactivated.']
                : [],
        ];
    }

    private function previewCustomer(Customer $model): array
    {
        $sales = $model->sales()->withTrashed()->count();

        $deps = [];
        if ($sales > 0) {
            $deps[] = $this->dep('Sales', $sales, false);
        }

        return [
            'can_delete'   => true,
            'entity_label' => 'Customer: ' . $model->name,
            'dependencies' => $deps,
            'warnings'     => $sales > 0
                ? ['Sales history will be preserved after customer is deleted.']
                : [],
        ];
    }

    private function previewUser(User $model): array
    {
        $sales     = $model->sales()->count();
        $purchases = $model->purchases()->count();
        $expenses  = $model->createdExpenses()->count();

        $blocking = false; // Users are soft-deleted; activity logs preserved via withTrashed

        $deps = [];
        if ($sales > 0) {
            $deps[] = $this->dep('Sales Created', $sales, false);
        }
        if ($purchases > 0) {
            $deps[] = $this->dep('Purchases Created', $purchases, false);
        }
        if ($expenses > 0) {
            $deps[] = $this->dep('Expenses Created', $expenses, false);
        }

        return [
            'can_delete'   => true,
            'entity_label' => 'User: ' . $model->name,
            'dependencies' => $deps,
            'warnings'     => [
                'User will be soft-deleted. All created records remain intact.',
                'Activity logs reference this user and will be preserved.',
            ],
        ];
    }

    private function genericPreview(Model $model, string $class): array
    {
        return [
            'can_delete'   => true,
            'entity_label' => class_basename($class) . ' #' . $model->getKey(),
            'dependencies' => [],
            'warnings'     => [],
        ];
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function dep(string $label, int $count, bool $blocking): array
    {
        return compact('label', 'count', 'blocking');
    }

    /** @return string[] */
    private function financialWarnings(string $entityType): array
    {
        return [
            ucfirst($entityType) . ' records are soft-deleted only — data is preserved for audit and reporting.',
            'Hard delete of financial records is permanently disabled.',
        ];
    }
}
