# Master POS System — Persistent Context File

# Paste this ENTIRE file at the start of every new chat.

---

## PROJECT IDENTITY

- Name: Master POS System
- Version: v2.0
- Current Step: Step 16 — Reports ✅ COMPLETE
- Dev Environment: Windows 10, XAMPP, Git Bash
- Project Path: D:/xampp/htdocs/Laravel_12/MasterPOS

---

## TECH STACK (never change without explicit instruction)

- Backend: Laravel 12
- Frontend: React 18 + Inertia.js + TypeScript
- Styling: Tailwind CSS (native utility classes)
- Routing: Ziggy (route() helper in React)
- Permissions: Spatie laravel-permission
- Toast: sonner
- Confirm dialog: SweetAlert2
- Icons: lucide-react
- PDF: barryvdh/laravel-dompdf
- Charts: recharts (no install needed — bundled)

---

## ABSOLUTE CODING RULES (apply to every file, every step)

1. Create/Edit forms are ALWAYS in Modal — never separate pages
   (Exception: Product Create/Edit are separate pages — form too complex)
   (Exception: Purchase Create/Edit are separate pages — form too complex)
   (Exception: ProfitDistribution Create/Edit are separate pages — multi-step
   calculate-preview flow is too complex for a modal)
2. Toast notifications use sonner only
3. Confirm dialogs use SweetAlert2 only
4. All code comments and documentation: English only, never Bengali
5. Git commit messages: short, one line
6. Permission format: module.action (e.g. products.view)
7. Route name format: backend.{module}.{action}
8. Money/price fields: decimal(10,2) — never float
9. ActivityLogService::log() on every create/update/delete
10. SweetAlert2 confirmButtonColor: '#ef4444' for delete
11. Every DB table: id, timestamps. Soft-deletable: add deleted_at
12. STEP BY STEP ONLY — never write next module unless asked
13. Policies registered via Gate::policy() in AppServiceProvider only
14. Restore uses onlyTrashed()->findOrFail($id) — not route model binding
15. can array always passed from controller to Inertia::render()
16. Large pages split into \_components/ subfolder
17. Bulk actions authorized via Auth::user()->hasPermissionTo() directly
    (Gate::denies() with class-level policy unreliable)
18. Policy methods that only check permission (no model instance needed)
    must NOT have a model parameter — e.g. edit(User $user): bool
    (adding a model param causes ArgumentCountError when called with
    class string from controller)
19. Route::resource() inside a named group (->name('backend.')) must NOT
    use ->names([]) with 'backend.' prefix — group adds it automatically.
    Restore route also must use ->name('customers.restore') not
    ->name('backend.customers.restore')
20. SaleController::store() returns response()->json([id, reference_no])
    — NOT redirect() — because POS Index uses axios.post() for checkout
21. ProductGrid Product interface includes: barcode, description, weight,
    weight_unit, is_featured, is_taxable, discount_type, discount_value,
    min_sale_qty, images (string[]) — fetched via eager load in SaleController
22. ProductDetailModal exists at POS/\_components/ProductDetailModal.tsx
    — shows image slider, price with discount, stock, add to cart button
23. CartItem has leave animation — onRemove called after CSS transition ends
    via onTransitionEnd, not directly
24. SaleController::index() eager loads 'images' relation and maps
    image_path column (NOT 'path') for product images
25. InvoiceController uses abort_unless(hasPermissionTo()) directly —
    no Gate::policy() registration needed (Sale::class already bound to SalePolicy)
26. PDF Blade template uses public_path('storage/...') for logo —
    DomPDF requires server filesystem path, not URL
27. DomPDF does NOT support CSS Grid — use flexbox or HTML tables in
    pdf/invoice.blade.php only
28. Hold Orders are ephemeral POS data — NO soft delete, NO restore,
    NO trash. Hard delete only.
29. HoldOrderController uses AuthorizesRequests trait + $this->authorize()
    — NOT abort_unless(hasPermissionTo()) directly.
    Policy is registered in AppServiceProvider via Gate::policy().
    CRITICAL: update() must call $this->authorize('edit', $holdOrder)
    — pass ability name 'edit' explicitly because policy method is named
    edit(), not update(). Laravel maps authorize('update') → update()
    automatically, but our policy has no update() method — it has edit().
    Passing the wrong ability name causes silent 403.
30. HoldOrderController::index() and resume() eager load
    'items.product.images' and 'items.product.unit' — item map includes
    stock_qty, unit (name string), image (image_path of first image)
31. CartSidebar receives onHoldOrder + isHolding + cartHasItems props
    from POS/Index.tsx — "Hold Current Order" button lives inside
    CartSidebar footer, styled with blue-300 border (not amber)
32. Resume marks hold order as 'processing' — hard delete only after
    successful Sale. Cancel/fail → release() reverts to 'active'
33. handleResumeHoldOrder() in POS/Index.tsx normalizes ALL numeric
    fields from API to Number() — Laravel decimal-cast columns arrive
    as strings in JSON; string concatenation breaks subtotal math.
    Also defensively unwraps unit relation object → name string.
34. InvestmentController uses Gate::allows() directly (abort_unless pattern)
    — NOT $this->authorize() — consistent with ExpenseController pattern.
    Policy registered in AppServiceProvider: Gate::policy(Investment::class,
    InvestmentPolicy::class)
35. Investment::attachment_url is an Eloquent accessor — must be explicitly
    appended via $investment->append(['attachment_url']) in index() paginator
    collection, otherwise JSON serialization drops it and the edit modal
    cannot preview the existing file.
36. InvestmentController::show() passes 'investmentTypes' prop so the
    InvestmentModal opened from Show.tsx has the dropdown options available.
37. Paginator meta destructuring must use safe fallbacks in TypeScript:
    const data = investments.data ?? [];
    const meta = investments.meta ?? {};
    const links = investments.links ?? [];
    Direct destructure crashes when meta is undefined on first render.
38. Export routes use GET /backend/investments/export/{format} where
    format ∈ ['csv', 'excel', 'pdf']. Export route declared BEFORE
    resource() to prevent {investment} swallowing 'export' segment.
    CSV is native (no package). Excel requires maatwebsite/excel.
    PDF reuses barryvdh/laravel-dompdf with separate Blade template.
    Shared filter logic extracted to private buildExportQuery(Request).
39. ProfitDistributionController uses optional(Auth::user())->can()
    pattern (NOT Auth::user()->hasPermissionTo()) — safer for nullable
    auth context. Gate::policy() registered in AppServiceProvider.
40. ProfitDistribution::generateDistributionNo() must be called inside
    DB::transaction() with lockForUpdate() — prevents race condition on
    concurrent store() requests. Format: PD-YYYY-000001. withTrashed()
    included so deleted records' numbers are never reused.
41. ProfitDistribution financial fields (total_revenue, total_cogs, etc.)
    are SNAPSHOTS — written once at store(), never recalculated from DB.
    Edit page has explicit "Recalculate" button that calls calculate-preview
    and replaces snapshot values + items array together.
42. Edit.tsx date fields must use toDateInputValue() helper — Laravel
    'date' cast returns full ISO datetime string ("2026-07-05T00:00:00Z");
    slicing to [0,10] gives "YYYY-MM-DD" required by <input type="date">.
    Without this, date inputs render blank on edit page load.
43. ProfitDistributionItem has NO softDeletes — cascadeOnDelete from
    parent. Payment tracking fields (payment_status, payment_method,
    transaction_reference, paid_by, paid_at) are updated via separate
    PATCH route after distribution is approved/distributed.
44. calculatePreview() sums ALL expenses in period (no status filter) —
    expenses table has no approval workflow/status column.
45. confirmAction() in Index.tsx handlers must use .then() pattern, NOT
    async/await — Inertia router callbacks (onSuccess/onError/onFinish)
    are incompatible with async event handlers in some React versions.
46. Shared TypeScript types for ProfitDistribution module extracted to:
    resources/js/types/profit-distribution.d.ts
    Exports: Distribution, DistributionStats, DistributionPermissions
47. ItemData / PreviewItem interfaces require index signature
    [key: string]: string | number | null — needed for TypeScript strict
    mode when items array is passed through Inertia router.post() payload.
48. Dashboard uses a single AJAX endpoint GET /backend/dashboard/data
    that returns ALL data in one response — no multiple fetch calls.
    Frontend fetches via native fetch() with Accept: application/json.
    Period filter triggers re-fetch; loading state shows Skeleton per Section.
49. Dashboard chart granularity is auto: daily for ≤60 day ranges,
    monthly for >60 days. recharts ComposedChart used for Sales trend
    (Bar + Line), PieChart for payment breakdown and expense category.
50. Dashboard ActivityLog::with('user:id,name') requires user() BelongsTo
    relation on ActivityLog model with withTrashed() — add if missing.
51. Dashboard components split into \_components/ — Index.tsx imports all,
    passes typed props. All types exported from Index.tsx for reuse.
52. NeedsAttention panel only renders when at least one count > 0 —
    returns null otherwise to avoid empty amber box on healthy systems.
53. Dashboard data route declared BEFORE resource routes to prevent
    wildcard swallowing: route('backend.dashboard.data') must come first.
54. Reports use ReportController — single controller, 7 report methods
    - 1 export() dispatcher. No separate export controller.
55. Report export() method handles profit-loss PDF separately —
    array_merge() would nest $summary inside data; profit-loss PDF needs
    $summary and $expenseByCategory at top level.
56. expenses table has NO status column — never select/filter by
    expenses.status in any query. Rule 44 confirms no approval workflow.
57. products table FK to categories is 'category_id' NOT
    'product_category_id' — always use products.category_id in raw
    DB::table() joins for inventory queries.
58. ReportController uses Gate::allows() + abort_unless() pattern
    (NOT Auth::user()->hasPermissionTo()) — consistent with
    InvestmentController pattern.
59. dateRange() helper uses $request->filled() not $request->input()
    with default — Laravel ConvertEmptyStringsToNull middleware converts
    empty strings to null, breaking input() fallback defaults.
60. Report PDF templates use $rows as Laravel Collection — ->sum(),
    ->count(), ->where() methods available directly in Blade without
    extra variables. All 5 report PDFs follow same header/kpi/table
    structure with DejaVu Sans font and flexbox layout (no CSS Grid).
61. SecurityHeaders middleware applied globally via bootstrap/app.php
    web stack. CSP allows: fonts.bunny.net, fonts.googleapis.com,
    fonts.gstatic.com. Local env also allows localhost:5173 for Vite HMR.
    IPv6 [::1] is NOT valid in CSP — vite.config.js must force
    host: 'localhost' to prevent Vite binding to [::1].
62. ValidateSortColumn middleware strips invalid sort_by and sort_order
    query params — per-module allowlists prevent SQL injection via
    orderBy() with user-supplied column names.
63. ProfitDistribution.$fillable must NOT include: status, is_locked,
    approved_by, approved_at, distributed_by, distributed_at.
    These are set only via approve() and distribute() model methods.
    ProfitDistributionItem.$fillable must NOT include: payment_status,
    payment_method, transaction_reference, paid_by, paid_at.
    These are set only via markAsPaid() and markAsCancelled() methods.
64. Session security: SESSION_ENCRYPT=true, SESSION_HTTP_ONLY=true,
    SESSION_SAME_SITE=lax, SESSION_SECURE_COOKIE=false (local HTTP).
    Production: SESSION_SECURE_COOKIE=true, APP_DEBUG=false.
65. Rate limiting applied to heavy/sensitive routes:
    pos.sales.store → throttle:30,1
    invoices.pdf → throttle:30,1
    investments.export → throttle:20,1
    reports.export → throttle:20,1
    settings.logo → throttle:10,1

---

## UI STANDARDS (never change)

- All pages use AuthenticatedLayout wrapper
- Native HTML elements only — NO shadcn/ui components in pages
- Color scheme: gray-50/100/200/300/400/500/600/700/800 + indigo-600/700
- Status badges: green-100/700 (active), gray-100/500 (inactive),
  amber-100/700 (processing/withdrawn), amber-500 (warning)
- Page header: text-2xl font-bold text-gray-800
- Buttons: rounded-lg bg-indigo-600 text-white hover:bg-indigo-700
- Tables: rounded-lg border border-gray-200 bg-white overflow-hidden
- Table header: bg-gray-50 border-b border-gray-100 font-medium text-gray-500
- Stats cards: rounded-lg border border-gray-200 bg-white p-4
- Form inputs: rounded-md border-gray-300 text-sm focus:border-indigo-500
  focus:ring-indigo-500
- Modals: fixed inset-0 z-50 bg-black/40 → centered max-w-md bg-white
  rounded-lg shadow-xl
- Modal header: border-b border-gray-100 px-5 py-4
- Modal footer: border-t border-gray-100 px-5 py-4 flex justify-end gap-2
- Toggle: custom inline-flex h-6 w-11 rounded-full (indigo-600 / gray-200)
- Action buttons: rounded-md p-1.5 text-gray-400 hover:bg-gray-100 (edit)
  / hover:bg-red-50 hover:text-red-500 (delete)
- Hold Order button in CartSidebar: border-blue-300 bg-white text-blue-700
  hover:bg-blue-50 (Pause icon from lucide-react)
- HoldOrdersDrawer: right-side slide panel max-w-sm, z-50
- EditModal inside drawer: z-[60] to render above drawer
- POS Terminal uses full viewport height layout (h-[calc(100vh-64px)])
  with 3-column split: product grid | cart | checkout panel
- Sidebar nav group labels must be unique — no two groups share the same
  label (duplicate labels cause React key collision warnings)
- Show/Detail pages: 2-column layout (lg:grid-cols-3) — main content
  takes lg:col-span-2, sidebar (Record Info + Actions) takes 1 col
- ProfitDistribution status badges:
  draft → bg-gray-100 text-gray-600
  approved → bg-amber-100 text-amber-700
  distributed → bg-green-100 text-green-700
- ProfitDistributionItem payment badges:
  pending → bg-amber-100 text-amber-700
  paid → bg-green-100 text-green-700
  cancelled → bg-red-100 text-red-700
- Dashboard Section wrapper: rounded-lg border border-gray-200 bg-white
  with border-b border-gray-100 px-5 py-3 header (text-sm font-medium
  text-gray-700) and p-5 body
- Dashboard NeedsAttention: amber-50 bg, amber-200 border, pill badges
  with amber-600 count bubble — hidden when all counts are zero
- Dashboard PeriodFilter: segmented pill group (indigo-600 active) +
  collapsible custom date range inputs
- Dashboard KPI cards: left-colored border accent per category
  (indigo=revenue, red=expense, green=profit, amber=sales)
- Reports hub: 3-column card grid, each card is full <Link>, COLOR_MAP
  object keeps Tailwind classes static to prevent PurgeCSS stripping
- Report pages: back breadcrumb + print:hidden on filters/export bar,
  print:block title block with period range for printed copy
- Report KPI cards: border-l-4 accent color per metric category
- Report tables: tfoot totals row recalculates from filtered array
  (not summary props) for Inventory and CustomerLedger

---

## EXACT FOLDER STRUCTURE

MasterPOS/
├── app/
│ ├── Exports/
│ │ └── InvestmentExport.php
│ ├── Http/
│ │ ├── Controllers/
│ │ │ └── Backend/
│ │ │ ├── DashboardController.php
│ │ │ ├── UserController.php
│ │ │ ├── RoleController.php
│ │ │ ├── LoginHistoryController.php
│ │ │ ├── ActivityLogController.php
│ │ │ ├── SettingController.php
│ │ │ ├── PaymentMethodController.php
│ │ │ ├── ExpenseCategoryController.php
│ │ │ ├── InvestmentTypeController.php
│ │ │ ├── ProductCategoryController.php
│ │ │ ├── UnitController.php
│ │ │ ├── ProductController.php
│ │ │ ├── NotificationController.php
│ │ │ ├── SupplierController.php
│ │ │ ├── PurchaseController.php
│ │ │ ├── PurchasePaymentController.php
│ │ │ ├── CustomerController.php
│ │ │ ├── SaleController.php
│ │ │ ├── InvoiceController.php
│ │ │ ├── HoldOrderController.php
│ │ │ ├── ExpenseController.php
│ │ │ ├── InvestmentController.php
│ │ │ ├── ProfitDistributionController.php
│ │ │ └── ReportController.php
│ │ ├── Middleware/
│ │ │ ├── SecurityHeaders.php
│ │ │ └── ValidateSortColumn.php
│ │ └── Requests/
│ │ └── Backend/
│ │ ├── StoreUserRequest.php
│ │ ├── UpdateUserRequest.php
│ │ ├── StoreProductCategoryRequest.php
│ │ ├── UpdateProductCategoryRequest.php
│ │ ├── StoreUnitRequest.php
│ │ ├── UpdateUnitRequest.php
│ │ ├── StoreProductRequest.php
│ │ ├── UpdateProductRequest.php
│ │ ├── StoreSupplierRequest.php
│ │ ├── UpdateSupplierRequest.php
│ │ ├── StorePurchaseRequest.php
│ │ ├── UpdatePurchaseRequest.php
│ │ ├── StorePurchasePaymentRequest.php
│ │ ├── StoreCustomerRequest.php
│ │ ├── UpdateCustomerRequest.php
│ │ ├── StoreSaleRequest.php
│ │ ├── StoreHoldOrderRequest.php
│ │ ├── UpdateHoldOrderRequest.php
│ │ ├── StoreExpenseRequest.php
│ │ ├── UpdateExpenseRequest.php
│ │ ├── StoreInvestmentRequest.php
│ │ ├── UpdateInvestmentRequest.php
│ │ ├── StoreProfitDistributionRequest.php
│ │ └── UpdateProfitDistributionRequest.php
│ ├── Models/
│ │ ├── User.php
│ │ ├── LoginHistory.php
│ │ ├── ActivityLog.php
│ │ ├── BusinessSetting.php
│ │ ├── PaymentMethod.php
│ │ ├── ExpenseCategory.php
│ │ ├── InvestmentType.php
│ │ ├── ProductCategory.php
│ │ ├── Unit.php
│ │ ├── Product.php
│ │ ├── ProductImage.php
│ │ ├── Supplier.php
│ │ ├── Purchase.php
│ │ ├── PurchaseItem.php
│ │ ├── PurchasePayment.php
│ │ ├── StockMovement.php
│ │ ├── Customer.php
│ │ ├── Sale.php
│ │ ├── SaleItem.php
│ │ ├── HoldOrder.php
│ │ ├── HoldOrderItem.php
│ │ ├── Expense.php
│ │ ├── Investment.php
│ │ ├── ProfitDistribution.php
│ │ └── ProfitDistributionItem.php
│ ├── Notifications/
│ │ ├── LowStockNotification.php
│ │ ├── NewSaleNotification.php
│ │ └── NewExpenseNotification.php
│ ├── Policies/
│ │ ├── UserPolicy.php
│ │ ├── RolePolicy.php
│ │ ├── SettingPolicy.php
│ │ ├── PaymentMethodPolicy.php
│ │ ├── ExpenseCategoryPolicy.php
│ │ ├── InvestmentTypePolicy.php
│ │ ├── ProductCategoryPolicy.php
│ │ ├── UnitPolicy.php
│ │ ├── ProductPolicy.php
│ │ ├── NotificationPolicy.php
│ │ ├── SupplierPolicy.php
│ │ ├── PurchasePolicy.php
│ │ ├── CustomerPolicy.php
│ │ ├── SalePolicy.php
│ │ ├── InvoicePolicy.php
│ │ ├── HoldOrderPolicy.php
│ │ ├── ExpensePolicy.php
│ │ ├── InvestmentPolicy.php
│ │ └── ProfitDistributionPolicy.php
│ ├── Providers/
│ │ └── AppServiceProvider.php
│ └── Services/
│ ├── ActivityLogService.php
│ ├── PurchaseStockService.php
│ └── SaleStockService.php
├── database/
│ ├── migrations/
│ └── seeders/
│ ├── DatabaseSeeder.php
│ ├── RolePermissionSeeder.php
│ ├── BusinessSettingSeeder.php
│ ├── PaymentMethodSeeder.php
│ ├── ExpenseCategorySeeder.php
│ ├── InvestmentTypeSeeder.php
│ ├── Step03PermissionSeeder.php
│ ├── Step04PermissionSeeder.php
│ ├── Step05PermissionSeeder.php
│ ├── Step06PermissionSeeder.php
│ ├── Step07PermissionSeeder.php
│ ├── Step08PermissionSeeder.php
│ ├── Step09PermissionSeeder.php
│ ├── Step10PermissionSeeder.php
│ ├── Step11PermissionSeeder.php
│ ├── Step12PermissionSeeder.php
│ ├── Step13PermissionSeeder.php
│ ├── Step14PermissionSeeder.php
│ ├── Step16PermissionSeeder.php
│ ├── UnitSeeder.php
│ ├── ProductCategorySeeder.php
│ └── NotificationSeeder.php
├── resources/
│ ├── views/
│ │ └── pdf/
│ │ ├── invoice.blade.php
│ │ ├── investments_export.blade.php
│ │ ├── report_sales.blade.php
│ │ ├── report_purchases.blade.php
│ │ ├── report_profit_loss.blade.php
│ │ ├── report_customer_ledger.blade.php
│ │ ├── report_investments.blade.php
│ │ └── report_inventory.blade.php
│ └── js/
│ ├── Pages/
│ │ └── Backend/
│ │ ├── Dashboard/
│ │ │ ├── Index.tsx
│ │ │ └── \_components/
│ │ │ ├── PeriodFilter.tsx
│ │ │ ├── FinancialSummary.tsx
│ │ │ ├── SalesChart.tsx
│ │ │ ├── SalesAnalytics.tsx
│ │ │ ├── SalesAnalyticsChart.tsx
│ │ │ ├── ExpenseBreakdown.tsx
│ │ │ ├── InventoryPanel.tsx
│ │ │ ├── CustomerAnalytics.tsx
│ │ │ ├── ProductAnalytics.tsx
│ │ │ ├── NeedsAttention.tsx
│ │ │ ├── RecentActivities.tsx
│ │ │ ├── NotificationsPanel.tsx
│ │ │ └── RecentSales.tsx
│ │ ├── Users/Index.tsx
│ │ ├── Roles/Index.tsx
│ │ ├── LoginHistories/Index.tsx
│ │ ├── ActivityLogs/Index.tsx
│ │ ├── Settings/
│ │ │ ├── Index.tsx
│ │ │ ├── PaymentMethods.tsx
│ │ │ ├── ExpenseCategories.tsx
│ │ │ └── InvestmentTypes.tsx
│ │ ├── Products/
│ │ │ ├── Index.tsx
│ │ │ ├── Create.tsx
│ │ │ ├── Edit.tsx
│ │ │ └── \_components/
│ │ │ ├── ProductStatsCards.tsx
│ │ │ ├── ProductTable.tsx
│ │ │ ├── ProductFormFields.tsx
│ │ │ └── ImageUploader.tsx
│ │ ├── Products/Categories/
│ │ │ ├── Index.tsx
│ │ │ └── \_components/
│ │ │ ├── CategoryTable.tsx
│ │ │ └── CategoryModal.tsx
│ │ ├── Products/Units/
│ │ │ ├── Index.tsx
│ │ │ └── \_components/
│ │ │ ├── UnitTable.tsx
│ │ │ └── UnitModal.tsx
│ │ ├── Notifications/Index.tsx
│ │ ├── Suppliers/
│ │ │ ├── Index.tsx
│ │ │ └── \_components/
│ │ │ ├── SupplierTable.tsx
│ │ │ └── SupplierModal.tsx
│ │ ├── Purchases/
│ │ │ ├── Index.tsx
│ │ │ ├── Create.tsx
│ │ │ ├── Edit.tsx
│ │ │ ├── Show.tsx
│ │ │ └── \_components/
│ │ │ ├── PurchaseStatsCards.tsx
│ │ │ ├── PurchaseTable.tsx
│ │ │ ├── PurchaseFormFields.tsx
│ │ │ ├── PurchaseFilters.tsx
│ │ │ ├── BulkActionBar.tsx
│ │ │ ├── StatusBadge.tsx
│ │ │ ├── PaymentModal.tsx
│ │ │ └── PaymentsListModal.tsx
│ │ ├── Customers/
│ │ │ ├── Index.tsx
│ │ │ └── \_components/
│ │ │ ├── CustomerTable.tsx
│ │ │ └── CustomerModal.tsx
│ │ ├── POS/
│ │ │ ├── Index.tsx
│ │ │ ├── \_components/
│ │ │ │ ├── ProductSearch.tsx
│ │ │ │ ├── ProductGrid.tsx
│ │ │ │ ├── ProductDetailModal.tsx
│ │ │ │ ├── CartSidebar.tsx
│ │ │ │ ├── CartItem.tsx
│ │ │ │ ├── CheckoutPanel.tsx
│ │ │ │ ├── ReceiptModal.tsx
│ │ │ │ └── HoldOrdersDrawer.tsx
│ │ │ └── Sales/
│ │ │ ├── Index.tsx
│ │ │ ├── Show.tsx
│ │ │ └── \_components/
│ │ │ ├── SaleStatsCards.tsx
│ │ │ └── SaleTable.tsx
│ │ ├── Invoices/
│ │ │ ├── Index.tsx
│ │ │ ├── Show.tsx
│ │ │ └── \_components/
│ │ │ ├── InvoiceTable.tsx
│ │ │ └── InvoicePrintView.tsx
│ │ ├── Expenses/
│ │ │ ├── Index.tsx
│ │ │ ├── Show.tsx
│ │ │ └── \_components/
│ │ │ ├── ExpenseStatsCards.tsx
│ │ │ ├── ExpenseTable.tsx
│ │ │ └── ExpenseModal.tsx
│ │ ├── Investments/
│ │ │ ├── Index.tsx
│ │ │ ├── Show.tsx
│ │ │ └── \_components/
│ │ │ ├── InvestmentStatsCards.tsx
│ │ │ ├── InvestmentTable.tsx
│ │ │ └── InvestmentModal.tsx
│ │ ├── ProfitDistributions/
│ │ │ ├── Index.tsx
│ │ │ ├── Create.tsx
│ │ │ ├── Edit.tsx
│ │ │ ├── Show.tsx
│ │ │ └── \_components/
│ │ │ ├── ProfitDistributionStatsCards.tsx
│ │ │ └── ProfitDistributionTable.tsx
│ │ └── Reports/
│ │ ├── Index.tsx
│ │ ├── Sales.tsx
│ │ ├── Purchases.tsx
│ │ ├── Expenses.tsx
│ │ ├── ProfitLoss.tsx
│ │ ├── Inventory.tsx
│ │ ├── CustomerLedger.tsx
│ │ ├── Investments.tsx
│ │ └── \_components/
│ │ ├── ReportFilters.tsx
│ │ └── ExportBar.tsx
│ ├── Components/shared/
│ │ ├── DataTable.tsx
│ │ └── Modal.tsx
│ ├── hooks/useFlashToast.ts
│ ├── Layouts/AuthenticatedLayout.tsx
│ ├── lib/
│ │ ├── utils.ts
│ │ └── confirm.ts
│ └── types/
│ ├── user.d.ts
│ ├── role.d.ts
│ ├── log.d.ts
│ ├── notification.d.ts
│ └── profit-distribution.d.ts
└── routes/web.php

---

## INERTIA PAGE RENDER RULE

Controller renders: Inertia::render('Backend/Users/Index', [...])
File must exist at: resources/js/Pages/Backend/Users/Index.tsx

Capital B in Backend, capital first letter of each subfolder.
shadcn components import from: @/components/ui/... (lowercase)
Custom shared components: @/Components/shared/... (uppercase C)

---

## DATABASE — COMPLETED TABLES

### Step 02 Tables

users, login_histories, activity_logs
Spatie tables: roles, permissions, model_has_roles,
model_has_permissions, role_has_permissions

### Step 03 Tables

business_settings, payment_methods,
expense_categories, investment_types

### Step 04 Tables

product_categories, units, products, product_images

products table actual column names (critical):

- cost_price (NOT purchase_price, NOT buying_price)
- stock_qty (NOT stock_quantity)
- low_stock_threshold (NOT low_stock_alert)
- category_id (NOT product_category_id) ← FK to product_categories
- sale_price, is_active, deleted_at

### Step 05 Tables

notifications → id(uuid), type, notifiable_type, notifiable_id,
data(json), read_at(nullable), timestamps

### Step 06 Tables

suppliers → id, name, company, email(unique), phone, address,
city, country(default Bangladesh), opening_balance(decimal 10,2),
is_active(bool), timestamps, deleted_at

### Step 07 Tables

purchases → id, supplier_id(FK restrict), reference_no(unique),
purchase_date, purchase_status(enum: draft/ordered/received/
partial_received/cancelled default:draft), subtotal(dec10,2),
discount(dec10,2 default 0), tax(dec10,2 default 0),
shipping_cost(dec10,2 default 0), grand_total(dec10,2),
paid_amount(dec10,2 default 0), due_amount(dec10,2),
payment_status(enum: paid/partial/due default:due),
note(text nullable), created_by(FK users restrict),
updated_by(FK users nullable nullOnDelete),
timestamps, deleted_at

purchase_items → id, purchase_id(FK purchases cascadeDelete),
product_id(FK products restrict), quantity(int unsigned),
unit_cost(dec10,2), subtotal(dec10,2), timestamps

purchase_payments → id, purchase_id(FK purchases cascadeDelete),
payment_method_id(FK nullable nullOnDelete), amount(dec10,2),
payment_date, reference(varchar nullable), note(text nullable),
created_by(FK users restrict), timestamps

stock_movements → id, product_id(FK restrict),
reference_type(varchar nullable), reference_id(bigint nullable),
type(enum: purchase/sale/return/adjustment/transfer),
quantity(int), before_quantity(int), after_quantity(int),
unit_cost(dec10,2 nullable), note(text nullable),
created_by(FK nullable nullOnDelete), timestamps
indexes: (reference_type, reference_id), product_id, type

products table additions (Step 07 migration):
last_purchase_price(dec10,2 nullable), average_cost(dec10,2 default 0)

### Step 08 Tables

customers → id, name, email(unique nullable), phone(nullable),
address(text nullable), city(nullable), country(default Bangladesh),
opening_balance(decimal 10,2 default 0), is_active(bool default true),
timestamps, deleted_at

Customer Opening Balance note:

- opening_balance is for historical balances before using this POS only
- It is NOT related to current orders or sales
- Positive value = customer owes the business
- Negative value = business owes the customer

### Step 09 Tables

sales → id, reference_no(unique), customer_id(FK nullable nullOnDelete),
sale_date(date), subtotal(dec10,2), discount(dec10,2 default 0),
tax(dec10,2 default 0), grand_total(dec10,2),
paid_amount(dec10,2 default 0), due_amount(dec10,2),
payment_status(enum: paid/partial/due default:due),
payment_method_id(FK nullable nullOnDelete),
note(text nullable), created_by(FK users restrict),
timestamps, deleted_at

sale_items → id, sale_id(FK sales cascadeDelete),
product_id(FK products restrict), quantity(int unsigned),
unit_price(dec10,2), discount(dec10,2 default 0),
subtotal(dec10,2), timestamps

Reference format: SL-YYYYMMDD-XXXX (e.g. SL-20250705-0001)

### Step 10 Tables

No new tables — Invoice module reuses sales + sale_items +
business_settings tables.

### Step 11 Tables

hold_orders → id, reference_no(unique), customer_id(FK nullable
nullOnDelete), note(text nullable), status(enum: active/processing
default:active), subtotal(dec10,2 default 0),
discount(dec10,2 default 0), tax(dec10,2 default 0),
grand_total(dec10,2 default 0), expires_at(timestamp nullable),
created_by(FK users restrict), timestamps
NO deleted_at — hard delete only

hold_order_items → id, hold_order_id(FK hold_orders cascadeDelete),
product_id(FK products restrict), quantity(int unsigned),
unit_price(dec10,2), discount(dec10,2 default 0),
subtotal(dec10,2), timestamps

Reference format: HO-YYYYMMDD-XXXX (e.g. HO-20250705-0001)

### Step 12 Tables

expenses → id, expense_category_id(FK restrict),
payment_method_id(FK nullable nullOnDelete),
title, amount(dec10,2), expense_date(date),
reference(varchar nullable), attachment(varchar nullable),
note(text nullable),
created_by(FK users restrict),
updated_by(FK users nullable nullOnDelete),
timestamps, deleted_at
NO status column — expenses table has no approval workflow

### Step 13 Tables

investments → id, investment_type_id(FK restrict),
title(varchar), investor_name(varchar),
amount(decimal 10,2), investment_date(date),
reference(varchar nullable), attachment(varchar nullable),
note(text nullable), status(enum: active/withdrawn default:active),
created_by(FK users restrict),
updated_by(FK users nullable nullOnDelete),
timestamps, deleted_at

Attachment stored at: storage/app/public/investments/
Accepted types: jpg, jpeg, png, gif, webp, pdf, doc, docx, xlsx (max 5MB)

### Step 14 Tables

profit_distributions → id, distribution_no(varchar unique),
title(varchar), distribution_date(date),
period_start(date), period_end(date),
total_revenue(dec10,2 default 0), total_cogs(dec10,2 default 0),
total_expenses(dec10,2 default 0), total_investment(dec10,2 default 0),
gross_profit(dec10,2 default 0), net_profit(dec10,2 default 0),
distribution_percent(dec5,2 default 100),
distributable_amount(dec10,2 default 0),
status(enum: draft/approved/distributed default:draft),
is_locked(bool default false),
note(text nullable),
approved_by(FK users nullable nullOnDelete),
approved_at(timestamp nullable),
distributed_by(FK users nullable nullOnDelete),
distributed_at(timestamp nullable),
created_by(FK users restrict),
updated_by(FK users nullable nullOnDelete),
timestamps, deleted_at

profit_distribution_items → id,
profit_distribution_id(FK profit_distributions cascadeDelete),
investment_id(FK investments restrict),
investor_name(varchar), investment_title(varchar),
investment_type(varchar), invested_amount(dec10,2),
share_percent(dec8,4), share_amount(dec10,2),
payment_status(enum: pending/paid/cancelled default:pending),
payment_method(varchar nullable),
transaction_reference(varchar nullable),
paid_by(FK users nullable nullOnDelete),
paid_at(timestamp nullable),
note(text nullable), timestamps
NO deleted_at — cascadeOnDelete from parent

Distribution No format: PD-YYYY-000001

### Step 15 Tables

No new tables — Dashboard aggregates from all existing tables.

### Step 16 Tables

No new tables — Reports aggregate from all existing tables.

### Step 17 Tables

No new tables — Partnership Business Upgrade planning only.

---

## ROUTES — REGISTERED

### Step 02 Routes

GET /backend/users → backend.users.index
POST /backend/users → backend.users.store
PUT /backend/users/{user} → backend.users.update
DELETE /backend/users/{user} → backend.users.destroy
GET /backend/roles → backend.roles.index
POST /backend/roles → backend.roles.store
PUT /backend/roles/{role}/permissions → backend.roles.permissions
DELETE /backend/roles/{role} → backend.roles.destroy
GET /backend/login-histories → backend.login-histories.index
GET /backend/activity-logs → backend.activity-logs.index

### Step 03 Routes

GET/POST /backend/settings → backend.settings.index/update
POST /backend/settings/logo → backend.settings.logo
GET/POST/PUT/DELETE /backend/payment-methods/{?}
GET/POST/PUT/DELETE /backend/expense-categories/{?}
GET/POST/PUT/DELETE /backend/investment-types/{?}

### Step 04 Routes

GET /backend/product-categories → backend.product-categories.index
POST /backend/product-categories → backend.product-categories.store
PUT /backend/product-categories/{productCategory} → backend.product-categories.update
DELETE /backend/product-categories/{productCategory} → backend.product-categories.destroy
GET /backend/units → backend.units.index
POST /backend/units → backend.units.store
PUT /backend/units/{unit} → backend.units.update
DELETE /backend/units/{unit} → backend.units.destroy
GET /backend/products → backend.products.index
GET /backend/products/create → backend.products.create
POST /backend/products → backend.products.store
GET /backend/products/{product}/edit → backend.products.edit
PUT /backend/products/{product} → backend.products.update
DELETE /backend/products/{product} → backend.products.destroy
DELETE /backend/products/{product}/images/{image} → backend.products.images.destroy
POST /backend/products/{product}/images/{image}/primary → backend.products.images.primary

### Step 05 Routes

GET /backend/notifications → backend.notifications.index
POST /backend/notifications/{id}/read → backend.notifications.read
POST /backend/notifications/read-all → backend.notifications.read-all
DELETE /backend/notifications/{id} → backend.notifications.destroy
GET /backend/notifications/unread-count → backend.notifications.unread-count

### Step 06 Routes

GET /backend/suppliers → backend.suppliers.index
POST /backend/suppliers → backend.suppliers.store
PUT /backend/suppliers/{supplier} → backend.suppliers.update
DELETE /backend/suppliers/{supplier} → backend.suppliers.destroy
POST /backend/suppliers/{id}/restore → backend.suppliers.restore

### Step 07 Routes

POST /backend/purchases/bulk-action → backend.purchases.bulk-action
POST /backend/purchases/{id}/restore → backend.purchases.restore
POST /backend/purchases/{purchase}/duplicate → backend.purchases.duplicate
GET /backend/purchases → backend.purchases.index
GET /backend/purchases/create → backend.purchases.create
POST /backend/purchases → backend.purchases.store
GET /backend/purchases/{purchase} → backend.purchases.show
GET /backend/purchases/{purchase}/edit → backend.purchases.edit
PUT /backend/purchases/{purchase} → backend.purchases.update
DELETE /backend/purchases/{purchase} → backend.purchases.destroy
GET /backend/purchases/{purchase}/payments → backend.purchases.payments.index
POST /backend/purchases/{purchase}/payments → backend.purchases.payments.store
DELETE /backend/purchases/{purchase}/payments/{payment} → backend.purchases.payments.destroy

### Step 08 Routes

GET /backend/customers → backend.customers.index
POST /backend/customers → backend.customers.store
PUT /backend/customers/{customer} → backend.customers.update
DELETE /backend/customers/{customer} → backend.customers.destroy
POST /backend/customers/{id}/restore → backend.customers.restore

### Step 09 Routes

GET /backend/pos → backend.pos.index
POST /backend/pos/sales → backend.pos.sales.store
GET /backend/pos/sales → backend.pos.sales.index
GET /backend/pos/sales/{sale} → backend.pos.sales.show
DELETE /backend/pos/sales/{sale} → backend.pos.sales.destroy
POST /backend/pos/sales/{id}/restore → backend.pos.sales.restore

### Step 10 Routes

GET /backend/invoices → backend.invoices.index
GET /backend/invoices/{sale} → backend.invoices.show
GET /backend/invoices/{sale}/pdf → backend.invoices.pdf

### Step 11 Routes

GET /backend/pos/hold-orders → backend.pos.hold-orders.index
POST /backend/pos/hold-orders → backend.pos.hold-orders.store
PUT /backend/pos/hold-orders/{id} → backend.pos.hold-orders.update
DELETE /backend/pos/hold-orders/{id} → backend.pos.hold-orders.destroy
POST /backend/pos/hold-orders/{id}/resume → backend.pos.hold-orders.resume
POST /backend/pos/hold-orders/{id}/release → backend.pos.hold-orders.release

### Step 12 Routes

GET /backend/expenses → backend.expenses.index
POST /backend/expenses → backend.expenses.store
GET /backend/expenses/{expense} → backend.expenses.show
PUT /backend/expenses/{expense} → backend.expenses.update
DELETE /backend/expenses/{expense} → backend.expenses.destroy
POST /backend/expenses/{id}/restore → backend.expenses.restore

### Step 13 Routes

GET /backend/investments/export/{format} → backend.investments.export
POST /backend/investments/{id}/restore → backend.investments.restore
GET /backend/investments → backend.investments.index
POST /backend/investments → backend.investments.store
GET /backend/investments/{investment} → backend.investments.show
PUT /backend/investments/{investment} → backend.investments.update
DELETE /backend/investments/{investment} → backend.investments.destroy

### Step 14 Routes

GET /backend/profit-distributions/calculate-preview → backend.profit-distributions.calculate-preview
POST /backend/profit-distributions/{id}/approve → backend.profit-distributions.approve
POST /backend/profit-distributions/{id}/distribute → backend.profit-distributions.distribute
POST /backend/profit-distributions/{id}/restore → backend.profit-distributions.restore
PATCH /backend/profit-distributions/{profit_distribution}/items/{item}/payment
→ backend.profit-distributions.items.payment
GET /backend/profit-distributions → backend.profit-distributions.index
GET /backend/profit-distributions/create → backend.profit-distributions.create
POST /backend/profit-distributions → backend.profit-distributions.store
GET /backend/profit-distributions/{profit_distribution} → backend.profit-distributions.show
GET /backend/profit-distributions/{profit_distribution}/edit → backend.profit-distributions.edit
PUT /backend/profit-distributions/{profit_distribution} → backend.profit-distributions.update
DELETE /backend/profit-distributions/{profit_distribution} → backend.profit-distributions.destroy

### Step 15 Routes

GET /backend/dashboard → backend.dashboard.index
GET /backend/dashboard/data → backend.dashboard.data

### Step 16 Routes

GET /backend/reports/{type}/export/{fmt} → backend.reports.export
GET /backend/reports → backend.reports.index
GET /backend/reports/sales → backend.reports.sales
GET /backend/reports/purchases → backend.reports.purchases
GET /backend/reports/expenses → backend.reports.expenses
GET /backend/reports/profit-loss → backend.reports.profit-loss
GET /backend/reports/inventory → backend.reports.inventory
GET /backend/reports/customer-ledger → backend.reports.customer-ledger
GET /backend/reports/investments → backend.reports.investments

Note: export route declared BEFORE named report routes to prevent
{type} wildcard swallowing named segments.

---

## PERMISSIONS — REGISTERED

### Step 02

users.view, users.create, users.edit, users.delete, users.archive, users.restore
roles.view, roles.create, roles.edit, roles.delete

### Step 03

settings.view, settings.edit
payment_method.view, payment_method.create, payment_method.edit, payment_method.delete
expense_category.view, expense_category.create, expense_category.edit, expense_category.delete
investment_type.view, investment_type.create, investment_type.edit, investment_type.delete

### Step 04

product_category.view, product_category.create, product_category.edit, product_category.delete
unit.view, unit.create, unit.edit, unit.delete
product.view, product.create, product.edit, product.delete

### Step 05

notification.view, notification.delete

### Step 06

supplier.view, supplier.create, supplier.edit, supplier.delete, supplier.restore

### Step 07

purchase.view, purchase.create, purchase.edit, purchase.delete,
purchase.restore, purchase.payment

### Step 08

customer.view, customer.create, customer.edit, customer.delete, customer.restore

### Step 09

sale.view, sale.create, sale.delete, sale.restore

### Step 10

invoice.view, invoice.print

### Step 11

hold_order.view, hold_order.create, hold_order.edit, hold_order.delete

### Step 12

expense.view, expense.create, expense.edit, expense.delete, expense.restore

### Step 13

investment.view, investment.create, investment.edit, investment.delete, investment.restore

### Step 14

profit_distribution.view, profit_distribution.create, profit_distribution.edit,
profit_distribution.delete, profit_distribution.restore, profit_distribution.approve

### Step 15

No new permissions — Dashboard accessible to all authenticated users.

### Step 16

report.view, report.export
Admin: both. Staff: report.view only.

---

## SEEDERS RUN

- RolePermissionSeeder → Admin (Step 02 permissions), Staff (empty)
- Step03PermissionSeeder → Admin + Staff view-only
- Step04PermissionSeeder → Admin (all), Staff (view-only)
- Step05PermissionSeeder → Admin (all), Staff (view-only)
- Step06PermissionSeeder → Admin (all), Staff (view-only)
- Step07PermissionSeeder → Admin (all), Staff (purchase.view only)
- Step08PermissionSeeder → Admin (all), Staff (customer.view only)
- Step09PermissionSeeder → Admin (all), Staff (sale.view + sale.create)
- Step10PermissionSeeder → Admin (all), Staff (invoice.view only)
- Step11PermissionSeeder → Admin (all), Staff (view + create + edit)
- Step12PermissionSeeder → Admin (all), Staff (expense.view only)
- Step13PermissionSeeder → Admin (all), Staff (investment.view only)
- Step14PermissionSeeder → Admin (all), Staff (profit_distribution.view only)
- Step16PermissionSeeder → Admin (all), Staff (report.view only)
- BusinessSettingSeeder, PaymentMethodSeeder,
  ExpenseCategorySeeder, InvestmentTypeSeeder
- UnitSeeder → pcs, kg, g, ltr, ml, mtr, box, dz
- ProductCategorySeeder → 4 parents + children
- NotificationSeeder → 5 notifications (3 unread, 2 read)

---

## KEY FILES — IMPORTANT IMPLEMENTATIONS

### AppServiceProvider.php

Registers: UserPolicy, RolePolicy, SettingPolicy,
PaymentMethodPolicy, ExpenseCategoryPolicy, InvestmentTypePolicy,
ProductCategoryPolicy, UnitPolicy, ProductPolicy,
NotificationPolicy (model: DatabaseNotification::class),
SupplierPolicy, PurchasePolicy, CustomerPolicy, SalePolicy,
HoldOrderPolicy (model: HoldOrder::class),
ExpensePolicy (model: Expense::class),
InvestmentPolicy (model: Investment::class),
ProfitDistributionPolicy (model: ProfitDistribution::class)
Event listener: Login::class → RecordLoginHistory::class
Note: InvoicePolicy NOT registered here — InvoiceController uses
abort_unless(hasPermissionTo()) directly
Note: ReportController has NO policy — uses Gate::allows() directly

### ActivityLogService.php

Usage: ActivityLogService::log('module', 'action', 'description', $model, $properties)
Note: pass $model object, not $model->id

### confirm.ts

Usage: const ok = await confirmAction({ title, text, confirmButtonText })
Note: In Index page handlers use .then() pattern — NOT async/await

### NotificationController.php

- Uses direct DatabaseNotification query (not auth()->user()->notifications() relation)
- Page prop name: 'notificationList' (not 'notifications')

### HandleInertiaRequests.php

Shares globally: auth.user, flash, ziggy, notifications (unread_count + latest 8)

### HoldOrderController.php

- Uses AuthorizesRequests trait + $this->authorize()
- update() → $this->authorize('edit', $holdOrder) — 'edit' passed explicitly
- index() + resume() eager load: 'customer', 'items.product.images', 'items.product.unit'
- destroy() → ActivityLogService::log() BEFORE delete(), then hard delete

### InvestmentController.php

- Uses Gate::allows() + abort_unless()
- index() appends attachment_url accessor
- show() passes 'investmentTypes' prop
- buildExportQuery() private method for shared filter logic

### Investment.php

- attachment_url accessor, attachment_extension accessor, isAttachmentImage()
- SoftDeletes trait

### InvestmentExport.php

- Implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize

### ProfitDistributionController.php

- Uses optional(Auth::user())->can()
- calculatePreview() sums ALL expenses (no status filter)
- store() → DB::transaction() wraps generateDistributionNo()
- approve() → sets is_locked=true

### ProfitDistribution.php

- generateDistributionNo() → PD-YYYY-000001; withTrashed(); DB::transaction()
- approve() / distribute() — set status + audit fields
- $fillable excludes: status, is_locked, approved_by, approved_at,
  distributed_by, distributed_at (set only via model methods)

### ProfitDistributionItem.php

- $fillable excludes: payment_status, payment_method,
  transaction_reference, paid_by, paid_at
  (set only via markAsPaid() and markAsCancelled() model methods)

### DashboardController.php

- index() → Inertia::render — no props
- data() → single JSON endpoint
- chartData() — daily (≤60d) or monthly (>60d) auto-switch

### ActivityLog.php

- MUST have: user() BelongsTo relation → withTrashed()

### ReportController.php

- Single controller, 7 report methods + export() dispatcher
- authorizeView() / authorizeExport() use Gate::allows() + abort_unless()
- dateRange() uses $request->filled() — NOT $request->input() with default
- expenses() — NO status column selected (expenses table has none)
- inventory() — join uses products.category_id NOT product_category_id
- export() handles profit-loss PDF separately to avoid nested $summary
- profitLossData() returns summary as explicit array (not compact())
  with all keys Blade template expects
- CSV export via response()->streamDownload() — memory-safe
- All PDF templates: DejaVu Sans, flexbox only, A4 landscape

### SaleController.php

- store() returns response()->json([id, reference_no]) — NOT redirect()
- destroy() reverses stock via SaleStockService::reverseStock()

### InvoiceController.php

- No policy registration — uses abort_unless(hasPermissionTo()) directly
- withTrashed() on all queries

---

## COMPLETED MODULES

- Step 00: Project Standards ✅
- Step 01: Project Foundation ✅
- Step 02: Authentication & Permission ✅
- Step 03: Business Settings ✅
- Step 04: Product & Category Management ✅
- Step 05: Notification System ✅
- Step 06: Supplier Management ✅
- Step 07: Purchase & Inventory ✅
- Step 08: Customer Management ✅
- Step 09: POS (Cart/Sale) ✅
- Step 10: Invoice & Receipt ✅
- Step 11: Hold Orders ✅
- Step 12: Expense Management ✅
- Step 13: Investment Management ✅
- Step 14: Profit Distribution ✅
- Step 15: Dashboard & Analytics ✅
- Step 16: Reports ✅

## PENDING MODULES

- Step 17: Partnership Business Upgrade
- Step 18: Security Hardening
- Step 19: Performance Optimization
- Step 20: Testing

## NEXT STEP

Step 17 — Partnership Business Upgrade

---

## PARTNERSHIP BUSINESS UPGRADE — FULL ROADMAP (Step 17+)

### Vision

Transparent partnership accounting system supporting 2–100 investors.
Every investor can see their capital contribution, profit share, payment
history, and ROI. Capital and Profit are always tracked separately.

### Core Principles

1. Capital != Profit — investment capital and distributed profit are
   always tracked in separate ledgers and never mixed.
2. Snapshot Accounting — financial figures are frozen at distribution
   time. Approved snapshots are never recalculated or overwritten.
3. No edit after approval — use Reverse workflow instead of editing.
4. Full audit trail — every state change logged via ActivityLogService.
5. Transparent investor ledger — every investor can review their own
   history independently.

---

### Phase 1 — Advanced Profit Distribution (Step 17)

Extends the existing ProfitDistribution module with:

Investor Eligibility:

- Eligibility determined by investment_date and eligible_from_date
- Mid-period investors join the next eligible distribution by default
- Admin can manually override eligibility per investor per period
- Eligibility reason recorded for audit trail

Per-Investor Configuration:

- Individual profit share percentage per investor
- Distribution percentage configurable per investor
- Deferred profit support — carry forward to next period
- Reinvest profit directly into capital ledger

Profit Balance Tracking:

- Each investor has a running profit balance
- Profit payment cannot exceed available pending profit balance
- Partial payments allowed and tracked
- Pending profit carried forward automatically to next period
- Reverse or reopen cancelled payments

Payment States (extended):
Pending, Partial Paid, Paid, Deferred, Reinvested, Cancelled, Reopened.

Distribution Integrity:

- Frozen financial snapshots — approved data never changes
- Distribution locking after approval
- Complete audit trail for every state change
- Transparent investor ledger accessible per investor

Future Controllers for Phase 1:

- ProfitPaymentController — handles extended payment states
- DistributionReverseController — handles reversal and reopen workflow

---

### Phase 2 — Capital Ledger (Step 17 continued)

Capital and Profit must always remain separate.

Capital Ledger tracks:

- Capital Deposit (new investment)
- Capital Withdrawal (admin approval required)
- Capital Reinvestment (profit converted to capital)
- Capital Adjustment (admin correction with reason)
- Capital History (full timeline per investor)
- Running Capital Balance per investor

Capital Withdrawal Workflow:

- Investor requests withdrawal
- Admin reviews and approves or rejects
- Approved withdrawals recorded in Capital Ledger
- Capital balance updated immediately on approval

Future Controllers for Phase 2:

- CapitalLedgerController
- CapitalWithdrawalController

---

### Phase 3 — Investor Transparency & Statements (Step 17 continued)

Future reports and statements per investor:

- Investor Statement — full financial summary per investor
- Investor Timeline — chronological activity history
- Distribution History — all distributions with payment status
- Capital History — all capital movements
- ROI Report — return on investment per period and cumulative
- Financial Snapshot Report — frozen snapshot for each distribution
- Profit Ledger — detailed profit credit and debit history
- Capital Ledger — detailed capital movement history
- Transparency Dashboard — investor-facing overview of all activity

Future Controllers for Phase 3:

- InvestorStatementController

---

### Phase 4 — Investment-to-Business Tracking (Step 17 continued)

Every investment should be traceable through business operations.

Future reports will show per investor:

- Which products were purchased using invested capital
- Total sales generated from those products
- Revenue, Cost, Gross Profit, Net Profit
- Current inventory value from those purchases
- Remaining stock from invested capital
- Investor contribution percentage
- Investment performance over time

Implementation note: Use existing Inventory, Purchase, and Sales data.
Do not create duplicate records. Trace via stock movements and sale items.

---

### Phase 5 — Sales Payment System Upgrade (Step 17 continued)

Upgrade Sales to work like Purchase Payments with full payment tracking.

Future features:

- Record Payment against a sale
- Multiple partial payments per sale
- Payment history per sale
- Due collection tracking
- Payment receipts (PDF)
- Payment timeline per sale
- Payment notes and reference numbers

Sales History actions will include:

- View Sale
- Record Payment
- Payment History
- Print Invoice
- Send Email (future)
- Void Sale

Payment Status will extend to:

- Paid, Partial, Due, COD

Future Controller:

- SalesPaymentController

---

### Phase 6 — Cash on Delivery (COD) Support (Step 17 continued)

Add COD as a payment status for sales.

COD workflow:

- Sale created with payment_status = 'cod'
- Delivery confirmed by staff
- Record Payment converts COD to partial or paid
- COD sales tracked separately in reports

Payment Status roadmap:
Paid, Partial, Due, COD

---

### Phase 7 — Email System (Future)

Future email features integrated into business workflow:

After Sale:

- Send Invoice Email after checkout (optional button)
- Send Payment Receipt after payment recorded
- Send Due Reminder for overdue balances
- Resend Invoice on demand

After Distribution:

- Send Distribution Report to all investors
- Send individual Investor Statement via email

Business Settings will support:

- Automatic email on sale completion toggle
- Automatic email on payment recorded toggle
- Email templates per event type

Future Controller:

- EmailCampaignController (for batch sending)

---

### Phase 8 — Customer CRM Upgrade (Future)

Extend customer profiles with full relationship history:

- Purchase History — all orders with amounts and dates
- Payment History — all payments with method and reference
- Order Timeline — chronological purchase activity
- Favorite Products — most purchased products
- Favorite Categories — most purchased categories
- Lifetime Purchase value
- Lifetime Profit generated from customer
- Average Order Value
- Last Purchase date
- Customer Analytics — trends and patterns
- Customer Tags — manual labels (VIP, Wholesale, Due, COD)
- Customer Segments — auto-group by behavior

---

### Phase 9 — Marketing Module (Future — Separate Module)

This is a completely separate future module, not part of core POS.

Planned features:

- Email Campaign builder
- Customer Segments targeting
- Product Launch Email
- Category-wise Campaign
- Product-wise Campaign
- Promotional Campaign
- VIP Customer campaigns
- Wholesale Customer campaigns
- Due Customer reminder campaigns
- COD Customer follow-up campaigns

Future Controller:

- CustomerMarketingController

---

### Future Controllers Summary

| Controller                    | Phase   | Purpose                 |
| ----------------------------- | ------- | ----------------------- |
| ProfitPaymentController       | Phase 1 | Extended payment states |
| DistributionReverseController | Phase 1 | Reversal and reopen     |
| CapitalLedgerController       | Phase 2 | Capital tracking        |
| CapitalWithdrawalController   | Phase 2 | Withdrawal approval     |
| InvestorStatementController   | Phase 3 | Statements and reports  |
| SalesPaymentController        | Phase 5 | Sales payment tracking  |
| EmailCampaignController       | Phase 7 | Email sending           |
| CustomerMarketingController   | Phase 9 | Marketing campaigns     |

---

### Security Hardening Plan (Step 18)

Planned tasks:

- SecurityHeaders middleware (CSP, X-Frame-Options, etc.)
- ValidateSortColumn middleware (prevent SQL injection via orderBy)
- Mass assignment audit on all models
- XSS audit on all PDF Blade templates
- Rate limiting on heavy routes (POS sale, export, invoice PDF)
- Session security config (encrypt, http_only, same_site)
- FormRequest enum validation audit
- File upload MIME type validation audit

Known implementation notes (from Step 17 Security work done in parallel):

- CSP local env must allow localhost:5173 for Vite HMR
- IPv6 [::1] is NOT valid in CSP — vite.config.js must force host:'localhost'
- SESSION_ENCRYPT=true safe to enable immediately
- SESSION_SECURE_COOKIE=false for local HTTP; true for production HTTPS
- ProfitDistribution.$fillable must exclude status, is_locked, approved_by,
  approved_at, distributed_by, distributed_at
- ProfitDistributionItem.$fillable must exclude payment_status,
  payment_method, transaction_reference, paid_by, paid_at

---

### Performance Optimization Plan (Step 19)

Planned tasks:

- Eager loading audit across all controllers
- Database index review on foreign keys and filter columns
- Query optimization for Dashboard data endpoint
- Pagination review — ensure all list pages paginate
- Config, route, and view caching for production
- Vite build optimization for frontend bundle size
- Queue-based processing for heavy exports (PDF, Excel)

---

### Testing Plan (Step 20)

Planned tasks:

- Feature tests for all CRUD controllers
- Policy authorization tests
- FormRequest validation tests
- POS checkout flow integration test
- Profit distribution snapshot integrity test
- Report export tests (CSV, Excel, PDF)
- Security middleware tests (CSP headers, rate limiting)
