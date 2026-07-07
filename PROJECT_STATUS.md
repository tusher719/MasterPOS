# Master POS System — Persistent Context File

# Paste this ENTIRE file at the start of every new chat.

---

## PROJECT IDENTITY

- Name: Master POS System
- Version: v2.0
- Current Step: Step 14 — Profit Distribution ✅ COMPLETE
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

---

## EXACT FOLDER STRUCTURE

MasterPOS/
├── app/
│ ├── Exports/
│ │ └── InvestmentExport.php
│ ├── Http/
│ │ ├── Controllers/
│ │ │ └── Backend/
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
│ │ │ └── ProfitDistributionController.php
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
│ ├── UnitSeeder.php
│ ├── ProductCategorySeeder.php
│ └── NotificationSeeder.php
├── resources/
│ ├── views/
│ │ └── pdf/
│ │ ├── invoice.blade.php
│ │ └── investments_export.blade.php
│ └── js/
│ ├── Pages/
│ │ └── Backend/
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
│ │ └── ProfitDistributions/
│ │ ├── Index.tsx
│ │ ├── Create.tsx
│ │ ├── Edit.tsx
│ │ ├── Show.tsx
│ │ └── \_components/
│ │ ├── ProfitDistributionStatsCards.tsx
│ │ └── ProfitDistributionTable.tsx
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
❌ NO deleted_at — hard delete only

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
note(text nullable), status(enum: pending/approved/rejected
default:pending), created_by(FK users restrict),
updated_by(FK users nullable nullOnDelete),
timestamps, deleted_at

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
❌ NO deleted_at — cascadeOnDelete from parent

Distribution No format: PD-YYYY-000001

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

Note: export + restore declared BEFORE resource() to prevent
{investment} wildcard swallowing those segments.

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

Note: calculate-preview, approve, distribute, restore, items.payment
all declared BEFORE resource() to prevent wildcard swallowing.

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

Staff: profit_distribution.view only
Admin: all

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

### ActivityLogService.php

Usage: ActivityLogService::log('module', 'action', 'description', $model, $properties)
Note: pass $model object, not $model->id

### confirm.ts

Usage: const ok = await confirmAction({ title, text, confirmButtonText })
Note: In Index page handlers use .then() pattern — NOT async/await
(Inertia router callback compatibility)

### NotificationController.php

- Uses direct DatabaseNotification query (not auth()->user()->notifications() relation)
- Page prop name: 'notificationList' (not 'notifications') to avoid
  collision with globally shared notifications prop from HandleInertiaRequests

### HandleInertiaRequests.php

Shares globally: auth.user, flash, ziggy, notifications (unread_count + latest 8)

### HoldOrderController.php

- Uses AuthorizesRequests trait + $this->authorize() — NOT abort_unless()
- Policy registered in AppServiceProvider: Gate::policy(HoldOrder::class, HoldOrderPolicy::class)
- index() returns JSON paginated (not Inertia) — drawer fetches via axios
- index() + resume() eager load: 'customer', 'items.product.images', 'items.product.unit'
- item map includes: stock_qty, unit (product.unit.name string), image (first image_path)
- store() → DB transaction, creates hold_order + items, ActivityLogService::log
- update() → $this->authorize('edit', $holdOrder) — 'edit' passed explicitly
  because policy method is named edit(), not update(). Laravel maps authorize('update') → update()
  automatically, but our policy has no update() method — it has edit().
  Passing the wrong ability name causes silent 403.
- update() → replaces all items (delete + recreate) inside DB transaction
- resume() → markAsProcessing(), returns full item data for cart restore
- release() → markAsActive() (checkout cancelled or failed)
- destroy() → ActivityLogService::log() BEFORE delete(), then hard delete

### InvestmentController.php

- Uses Gate::allows() + abort_unless() — NOT $this->authorize()
- Policy registered: Gate::policy(Investment::class, InvestmentPolicy::class)
- index() appends attachment_url accessor via $investment->append(['attachment_url'])
  on paginator collection — required so edit modal can preview existing file
- show() passes 'investmentTypes' prop for the edit modal dropdown
- export() handles csv (native StreamedResponse), excel (maatwebsite),
  pdf (dompdf + resources/views/pdf/investments_export.blade.php)
- buildExportQuery() private method — shared filter logic for all 3 formats
- update() handles remove_attachment flag via elseif branch

### Investment.php

- attachment_url accessor: returns asset('storage/' . $this->attachment)
- attachment_extension accessor: pathinfo PATHINFO_EXTENSION
- isAttachmentImage(): checks extension against jpg/jpeg/png/gif/webp
- Relations: investmentType, creator (withTrashed), updater (withTrashed)
- Scopes: scopeActive(), scopeWithdrawn()
- SoftDeletes trait — has deleted_at

### InvestmentExport.php (app/Exports/)

- Implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
- Constructor receives Request — applies same filter logic as index()
- Requires: composer require maatwebsite/excel

### ProfitDistributionController.php

- Uses optional(Auth::user())->can() — NOT hasPermissionTo() directly
- Policy registered: Gate::policy(ProfitDistribution::class, ProfitDistributionPolicy::class)
- calculatePreview() → GET + JSON; sums ALL expenses (no status filter);
  COGS via JOIN sale_items × products.average_cost
- store() → DB::transaction() wraps generateDistributionNo() + insert
- update() → items delete + recreate (same as HoldOrder pattern)
- approve() → calls $distribution->approve(Auth::id()) — sets is_locked=true
- distribute() → calls $distribution->distribute(Auth::id())
- updateItemPayment() → PATCH; only pending→paid or pending→cancelled
- show() → appends paid_items_count, pending_items_count, total_paid_amount
- restore() → onlyTrashed()->findOrFail() — Rule #14

### ProfitDistribution.php

- generateDistributionNo() → PD-YYYY-000001; withTrashed() included;
  must be called inside DB::transaction() with lockForUpdate()
- approve() → status=approved, is_locked=true, approved_by, approved_at
- distribute() → status=distributed, distributed_by, distributed_at
- Accessors: paid_items_count, pending_items_count, total_paid_amount
  (must be appended in controller via ->append([...]))
- Relations: items, creator/updater/approver/distributor (all withTrashed)
- SoftDeletes — has deleted_at

### ProfitDistributionItem.php

- No SoftDeletes — cascadeOnDelete from parent
- markAsPaid(userId, method, reference) — payment_status=paid + audit
- markAsCancelled() — payment_status=cancelled
- investment() relation → withTrashed() for ledger JOIN compatibility
- paidByUser() relation → withTrashed()

### Edit.tsx (ProfitDistributions)

- toDateInputValue() helper — slices ISO datetime to YYYY-MM-DD for
  <input type="date"> compatibility (Laravel date cast quirk)
- Recalculate button replaces all snapshot fields + items together
- is_locked guard at top — renders Lock screen instead of form

### SaleController.php

- index() eager loads Product with 'images' relation, maps image_path (NOT 'path')
- store() returns response()->json([id, reference_no]) — NOT redirect()
- destroy() reverses stock via SaleStockService::reverseStock()
- restore() re-applies stock via SaleStockService::reApplyStock()

### InvoiceController.php

- No policy registration — uses abort_unless(hasPermissionTo()) directly
- withTrashed() on all queries — voided invoices still visible
- pdf() → DomPDF download via resources/views/pdf/invoice.blade.php

### pdf/invoice.blade.php

- DejaVu Sans font, public_path() for logo, flexbox/tables only (no Grid)

### SaleStockService.php

- applyStock() / reverseStock() / reApplyStock() / checkLowStock()

### SalePolicy.php

- delete() and restore() have NO model instance parameter

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

## PENDING MODULES

- Step 15: Dashboard & Analytics
- Step 16: Reports
- Step 17: Security Hardening
- Step 18: Performance Optimization
- Step 19: Testing

## NEXT STEP

Step 15 — Dashboard & Analytics
