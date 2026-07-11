# Master POS System — Persistent Context File

# Paste this ENTIRE file at the start of every new chat.

---

## PROJECT IDENTITY

- Name: Master POS System
- Version: v2.0
- Current Step: Step 17 Phase 1 — Advanced Profit Distribution ✅ COMPLETE
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
- Charts: recharts (bundled) + @mantine/charts (for new investor pages)
- UI extras: @mantine/core/dates/carousel/tiptap v8, dayjs

---

## ABSOLUTE CODING RULES (apply to every file, every step)

1. Create/Edit forms are ALWAYS in Modal — never separate pages
   (Exception: Product, Purchase, ProfitDistribution Create/Edit — separate pages)
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
18. Policy methods that only check permission (no model instance needed) must NOT have a model parameter
19. Route::resource() inside named group must NOT use ->names([]) with 'backend.' prefix
20. SaleController::store() returns response()->json([id, reference_no]) — NOT redirect()
21. ProductGrid Product interface includes all product fields (barcode, description, weight, etc.)
22. ProductDetailModal exists at POS/\_components/ProductDetailModal.tsx
23. CartItem has leave animation via onTransitionEnd
24. SaleController::index() eager loads 'images' and maps image_path column
25. InvoiceController uses abort_unless(hasPermissionTo()) directly — no policy registration
26. PDF Blade template uses public_path('storage/...') for logo
27. DomPDF does NOT support CSS Grid — flexbox or HTML tables only in Blade
28. Hold Orders: NO soft delete, NO restore, NO trash. Hard delete only.
29. HoldOrderController uses AuthorizesRequests + $this->authorize('edit', $holdOrder)
30. HoldOrderController eager loads 'items.product.images' and 'items.product.unit'
31. CartSidebar receives onHoldOrder + isHolding + cartHasItems props
32. Resume marks hold order as 'processing'; hard delete after successful Sale
33. handleResumeHoldOrder() normalizes ALL numeric fields with Number()
34. InvestmentController uses Gate::allows() + abort_unless() pattern
35. Investment::attachment_url accessor must be appended via $investment->append([])
36. InvestmentController::show() passes 'investmentTypes' prop
37. Paginator meta destructuring must use safe fallbacks: data ?? [], meta ?? {}, links ?? []
38. Export routes declared BEFORE resource() to prevent wildcard swallowing
39. ProfitDistributionController uses optional(Auth::user())->can() pattern
40. ProfitDistribution::generateDistributionNo() inside DB::transaction() with lockForUpdate()
41. ProfitDistribution financial fields are SNAPSHOTS — written once at store()
42. Edit.tsx date fields must use toDateInputValue() helper (slice ISO to [0,10])
43. ProfitDistributionItem has NO softDeletes — cascadeOnDelete from parent
44. calculatePreview() sums ALL expenses in period (no status filter)
45. confirmAction() handlers use .then() pattern — NOT async/await
46. Shared TypeScript types for ProfitDistribution: resources/js/types/profit-distribution.d.ts
47. ItemData / PreviewItem interfaces require index signature [key: string]: string | number | null
48. Dashboard uses single AJAX endpoint GET /backend/dashboard/data
49. Dashboard chart granularity: daily ≤60d, monthly >60d
50. Dashboard ActivityLog::with('user:id,name') requires user() BelongsTo with withTrashed()
51. Dashboard components split into \_components/; all types exported from Index.tsx
52. NeedsAttention panel returns null when all counts are zero
53. Dashboard data route declared BEFORE resource routes
54. Reports use ReportController — single controller, 7 methods + export() dispatcher
55. Report export() handles profit-loss PDF separately (array_merge() nesting issue)
56. expenses table has NO status column — never filter by expenses.status
57. products FK to categories is category_id NOT product_category_id
58. ReportController uses Gate::allows() + abort_unless() pattern
59. dateRange() helper uses $request->filled() not $request->input() with default
60. Report PDF templates use $rows as Laravel Collection; DejaVu Sans font; flexbox only
61. SecurityHeaders middleware applied globally; CSP allows fonts.bunny.net/googleapis/gstatic + localhost:5173
62. ValidateSortColumn middleware strips invalid sort_by/sort_order params
63. ProfitDistribution.$fillable excludes: status, is_locked, approved_by, approved_at, distributed_by, distributed_at
    ProfitDistributionItem.$fillable excludes: payment_status, payment_method, transaction_reference, paid_by, paid_at
64. Session security: SESSION_ENCRYPT=true, SESSION_HTTP_ONLY=true, SESSION_SAME_SITE=lax
65. Rate limiting: pos.sales.store→30,1 | invoices.pdf→30,1 | investments.export→20,1 | reports.export→20,1 | settings.logo→10,1
66. ProfitDistributionItem.payment_status and ProfitDistribution status/is_locked/approved_by/
    approved_at/distributed_by/distributed_at are excluded from $fillable.
    Always use forceFill([...])->save() inside syncPaymentStatus() and model transition
    methods (approve/distribute/reverse) to bypass mass assignment guard.

---

## UI STANDARDS (never change)

- All pages use AuthenticatedLayout wrapper
- Native HTML elements only — NO shadcn/ui in pages
- Color scheme: gray-50/100/200/300/400/500/600/700/800 + indigo-600/700
- Status badges: green-100/700 (active), gray-100/500 (inactive), amber-100/700 (processing/withdrawn)
- Page header: text-2xl font-bold text-gray-800
- Buttons: rounded-lg bg-indigo-600 text-white hover:bg-indigo-700
- Tables: rounded-lg border border-gray-200 bg-white overflow-hidden
- Table header: bg-gray-50 border-b border-gray-100 font-medium text-gray-500
- Stats cards: rounded-lg border border-gray-200 bg-white p-4
- Form inputs: rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500
- Modals: fixed inset-0 z-50 bg-black/40 → centered max-w-md bg-white rounded-lg shadow-xl
- Modal header: border-b border-gray-100 px-5 py-4
- Modal footer: border-t border-gray-100 px-5 py-4 flex justify-end gap-2
- Action buttons: rounded-md p-1.5 text-gray-400 hover:bg-gray-100 (edit) / hover:bg-red-50 hover:text-red-500 (delete)
- POS Terminal: full viewport height h-[calc(100vh-64px)], 3-column split
- Show/Detail pages: lg:grid-cols-3 — main lg:col-span-2, sidebar 1 col
- Dashboard Section: rounded-lg border border-gray-200 bg-white, border-b header, p-5 body
- Reports: 3-column card grid; COLOR_MAP object keeps Tailwind classes static
- Mantine Dates → date pickers in forms
- Mantine Carousel → image sliders
- Mantine Tiptap → rich text notes fields
- Mantine Charts → charts in new investor/capital pages only
- Page layout/tables/buttons/modals → always native HTML + Tailwind

---

## EXACT FOLDER STRUCTURE

MasterPOS/
├── app/
│ ├── Http/Controllers/Backend/
│ │ ├── DashboardController.php
│ │ ├── UserController.php, RoleController.php, LoginHistoryController.php, ActivityLogController.php
│ │ ├── SettingController.php, PaymentMethodController.php, ExpenseCategoryController.php, InvestmentTypeController.php
│ │ ├── ProductCategoryController.php, UnitController.php, ProductController.php, NotificationController.php
│ │ ├── SupplierController.php, PurchaseController.php, PurchasePaymentController.php
│ │ ├── CustomerController.php, SaleController.php, InvoiceController.php, HoldOrderController.php
│ │ ├── ExpenseController.php, InvestmentController.php
│ │ ├── ProfitDistributionController.php, ProfitPaymentController.php, DistributionReverseController.php
│ │ ├── InvestorBalanceController.php
│ │ └── ReportController.php
│ ├── Http/Middleware/
│ │ ├── SecurityHeaders.php
│ │ └── ValidateSortColumn.php
│ ├── Http/Requests/Backend/
│ │ ├── StoreUserRequest.php, UpdateUserRequest.php
│ │ ├── StoreProductCategoryRequest.php, UpdateProductCategoryRequest.php
│ │ ├── StoreUnitRequest.php, UpdateUnitRequest.php
│ │ ├── StoreProductRequest.php, UpdateProductRequest.php
│ │ ├── StoreSupplierRequest.php, UpdateSupplierRequest.php
│ │ ├── StorePurchaseRequest.php, UpdatePurchaseRequest.php, StorePurchasePaymentRequest.php
│ │ ├── StoreCustomerRequest.php, UpdateCustomerRequest.php
│ │ ├── StoreSaleRequest.php
│ │ ├── StoreHoldOrderRequest.php, UpdateHoldOrderRequest.php
│ │ ├── StoreExpenseRequest.php, UpdateExpenseRequest.php
│ │ ├── StoreInvestmentRequest.php, UpdateInvestmentRequest.php
│ │ ├── StoreProfitDistributionRequest.php, UpdateProfitDistributionRequest.php
│ │ ├── RecordPaymentRequest.php, ReverseDistributionRequest.php
│ ├── Models/
│ │ ├── User.php, LoginHistory.php, ActivityLog.php
│ │ ├── BusinessSetting.php, PaymentMethod.php, ExpenseCategory.php, InvestmentType.php
│ │ ├── ProductCategory.php, Unit.php, Product.php, ProductImage.php
│ │ ├── Supplier.php, Purchase.php, PurchaseItem.php, PurchasePayment.php, StockMovement.php
│ │ ├── Customer.php, Sale.php, SaleItem.php
│ │ ├── HoldOrder.php, HoldOrderItem.php
│ │ ├── Expense.php, Investment.php
│ │ ├── ProfitDistribution.php, ProfitDistributionItem.php
│ │ ├── ProfitDistributionEligibility.php, ProfitDistributionItemPayment.php
│ │ ├── InvestorProfitBalance.php
│ ├── Notifications/
│ │ ├── LowStockNotification.php, NewSaleNotification.php, NewExpenseNotification.php
│ ├── Policies/
│ │ ├── UserPolicy.php, RolePolicy.php, SettingPolicy.php
│ │ ├── PaymentMethodPolicy.php, ExpenseCategoryPolicy.php, InvestmentTypePolicy.php
│ │ ├── ProductCategoryPolicy.php, UnitPolicy.php, ProductPolicy.php, NotificationPolicy.php
│ │ ├── SupplierPolicy.php, PurchasePolicy.php, CustomerPolicy.php
│ │ ├── SalePolicy.php, InvoicePolicy.php, HoldOrderPolicy.php
│ │ ├── ExpensePolicy.php, InvestmentPolicy.php
│ │ ├── ProfitDistributionPolicy.php, ProfitDistributionEligibilityPolicy.php
│ │ ├── InvestorProfitBalancePolicy.php
│ ├── Providers/AppServiceProvider.php
│ ├── Exports/InvestmentExport.php
│ └── Services/
│ ├── ActivityLogService.php, PurchaseStockService.php, SaleStockService.php
├── database/
│ ├── migrations/
│ └── seeders/
│ ├── DatabaseSeeder.php, RolePermissionSeeder.php
│ ├── BusinessSettingSeeder.php, PaymentMethodSeeder.php
│ ├── ExpenseCategorySeeder.php, InvestmentTypeSeeder.php
│ ├── Step03PermissionSeeder.php through Step14PermissionSeeder.php
│ ├── Step16PermissionSeeder.php, Step17PermissionSeeder.php
│ ├── UnitSeeder.php, ProductCategorySeeder.php, NotificationSeeder.php
├── resources/
│ ├── views/pdf/
│ │ ├── invoice.blade.php, investments_export.blade.php
│ │ ├── report_sales.blade.php, report_purchases.blade.php, report_profit_loss.blade.php
│ │ ├── report_customer_ledger.blade.php, report_investments.blade.php, report_inventory.blade.php
│ └── js/
│ ├── Pages/Backend/
│ │ ├── Dashboard/Index.tsx + \_components/ (13 files)
│ │ ├── Users/Index.tsx, Roles/Index.tsx, LoginHistories/Index.tsx, ActivityLogs/Index.tsx
│ │ ├── Settings/Index.tsx + PaymentMethods.tsx + ExpenseCategories.tsx + InvestmentTypes.tsx
│ │ ├── Products/Index.tsx + Create.tsx + Edit.tsx + \_components/ (4 files)
│ │ ├── Products/Categories/Index.tsx + \_components/ (2 files)
│ │ ├── Products/Units/Index.tsx + \_components/ (2 files)
│ │ ├── Notifications/Index.tsx
│ │ ├── Suppliers/Index.tsx + \_components/ (2 files)
│ │ ├── Purchases/Index.tsx + Create.tsx + Edit.tsx + Show.tsx + \_components/ (8 files)
│ │ ├── Customers/Index.tsx + \_components/ (2 files)
│ │ ├── POS/Index.tsx + \_components/ (8 files) + Sales/Index.tsx + Show.tsx + \_components/ (2 files)
│ │ ├── Invoices/Index.tsx + Show.tsx + \_components/ (2 files)
│ │ ├── Expenses/Index.tsx + Show.tsx + \_components/ (3 files)
│ │ ├── Investments/Index.tsx + Show.tsx + \_components/ (3 files)
│ │ ├── ProfitDistributions/Index.tsx + Create.tsx + Edit.tsx + Show.tsx + \_components/ (6 files)
│ │ ├── InvestorBalances/Index.tsx + Show.tsx
│ │ └── Reports/Index.tsx + 7 report pages + \_components/ (2 files)
│ ├── Components/shared/DataTable.tsx + Modal.tsx
│ ├── hooks/useFlashToast.ts
│ ├── Layouts/AuthenticatedLayout.tsx
│ ├── lib/utils.ts + confirm.ts
│ └── types/user.d.ts + role.d.ts + log.d.ts + notification.d.ts + profit-distribution.d.ts
└── routes/web.php

---

## INERTIA PAGE RENDER RULE

Controller: Inertia::render('Backend/Users/Index', [...])
File: resources/js/Pages/Backend/Users/Index.tsx
Capital B in Backend, capital first letter of each subfolder.
shadcn imports: @/components/ui/... (lowercase c)
Custom shared: @/Components/shared/... (uppercase C)

---

## DATABASE — COMPLETED TABLES

### Steps 02–09 (see DATABASE_SCHEMA.md for full column details)

users, login_histories, activity_logs, Spatie tables
business_settings, payment_methods, expense_categories, investment_types
product_categories, units, products, product_images
notifications (uuid PK)
suppliers
purchases, purchase_items, purchase_payments, stock_movements
customers
sales, sale_items

### Step 11

hold_orders (NO deleted_at), hold_order_items

### Step 12

expenses (NO status column)

### Step 13

investments

### Step 14

profit_distributions, profit_distribution_items

### Step 17 Phase 1

profit_distribution_eligibilities
profit_distribution_item_payments
investor_profit_balances
profit_distribution_items additions: distribution_percent, deferred_amount, reinvested_amount, carried_from_distribution_id, payment_status enum extended

---

## ROUTES — REGISTERED

### Steps 02–09

GET/POST/PUT/DELETE standard CRUD for: users, roles, login-histories, activity-logs,
settings, payment-methods, expense-categories, investment-types,
product-categories, units, products (+ images), notifications,
suppliers (+ restore), purchases (+ payments + bulk-action + duplicate + restore),
customers (+ restore), pos/sales (+ restore), pos/hold-orders (full lifecycle)

### Step 10

GET /backend/invoices → backend.invoices.index
GET /backend/invoices/{sale} → backend.invoices.show
GET /backend/invoices/{sale}/pdf → backend.invoices.pdf

### Step 12

GET/POST /backend/expenses, GET/PUT/DELETE /backend/expenses/{expense}
POST /backend/expenses/{id}/restore, POST /backend/expenses/bulk-action

### Step 13

GET /backend/investments/export/{format} → backend.investments.export
POST /backend/investments/{id}/restore → backend.investments.restore
GET/POST/GET/PUT/DELETE standard resource for investments

### Step 14–17 (Profit Distributions — all under prefix profit-distributions)

GET calculate-preview → backend.profit-distributions.calculate-preview
POST {id}/approve → backend.profit-distributions.approve
POST {id}/distribute → backend.profit-distributions.distribute
POST {id}/restore → backend.profit-distributions.restore
POST {id}/reverse → backend.profit-distributions.reverse
GET {pd}/items/{item}/payments → backend.profit-distributions.items.payments.index
PATCH {pd}/items/{item}/payments → backend.profit-distributions.items.payments.store
DELETE {pd}/items/{item}/payments/{payment} → backend.profit-distributions.items.payments.cancel
PATCH {pd}/items/{item}/payments/{payment}/reopen → backend.profit-distributions.items.payments.reopen
POST {pd}/eligibilities/{eligibility}/override → backend.profit-distributions.eligibilities.override
PATCH {profit_distribution}/items/{item}/payment → backend.profit-distributions.items.payment (legacy)
GET/POST/GET/PUT/DELETE standard CRUD for profit-distributions

### Step 15

GET /backend/dashboard/data → backend.dashboard.data
GET /backend/dashboard → backend.dashboard.index

### Step 16

GET /backend/reports/{type}/export/{fmt} → backend.reports.export
GET /backend/reports (+ /sales/purchases/expenses/profit-loss/inventory/customer-ledger/investments)

### Step 17 Phase 1

GET /backend/investor-balances → backend.investor-balances.index
GET /backend/investor-balances/{investment} → backend.investor-balances.show

---

## PERMISSIONS — REGISTERED

### Steps 02–16

users: view/create/edit/delete/archive/restore
roles: view/create/edit/delete
settings: view/edit
payment_method/expense_category/investment_type: view/create/edit/delete
product_category/unit/product: view/create/edit/delete
notification: view/delete
supplier: view/create/edit/delete/restore
purchase: view/create/edit/delete/restore/payment
customer: view/create/edit/delete/restore
sale: view/create/delete/restore
invoice: view/print
hold_order: view/create/edit/delete
expense: view/create/edit/delete/restore
investment: view/create/edit/delete/restore
profit_distribution: view/create/edit/delete/restore/approve
report: view/export

### Step 17 Phase 1

profit_distribution.eligibility — Admin only
profit_distribution.reverse — Admin only
profit_distribution.payment — Admin only
investor_balance.view — Admin only

---

## SEEDERS RUN

RolePermissionSeeder, Step03–Step14PermissionSeeder, Step16PermissionSeeder, Step17PermissionSeeder
BusinessSettingSeeder, PaymentMethodSeeder, ExpenseCategorySeeder, InvestmentTypeSeeder
UnitSeeder, ProductCategorySeeder, NotificationSeeder

---

## KEY FILES — IMPORTANT IMPLEMENTATIONS

### AppServiceProvider.php

Registers all policies via Gate::policy(). Step 17 additions:
Gate::policy(ProfitDistributionEligibility::class, ProfitDistributionEligibilityPolicy::class)
Gate::policy(InvestorProfitBalance::class, InvestorProfitBalancePolicy::class)
Event listener: Login::class → RecordLoginHistory::class

### ActivityLogService.php

Usage: ActivityLogService::log('module', 'action', 'description', $model, $properties)

### confirm.ts

Usage: confirmAction({...}).then() — NOT async/await in Inertia handlers

### ProfitDistribution.php (Step 17 updated)

- approve()/distribute()/reverse() use forceFill()->save() (Rule 66)
- approve() credits InvestorProfitBalance per item via creditEarned()
- reverse() cancels all payments + reverses balance credits
- generateEligibilities() auto-creates eligibility records on approve
- $fillable excludes: status, is_locked, approved_by, approved_at, distributed_by, distributed_at

### ProfitDistributionItem.php (Step 17 updated)

- syncPaymentStatus() uses forceFill(['payment_status' => $status])->save() (Rule 66)
- $fillable excludes: payment_status, payment_method, transaction_reference, paid_by, paid_at
- effectiveAmount() = share_amount × (distribution_percent / 100)
- remainingAmount() = effective - totalPaid - deferred - reinvested
- payments() HasMany → ProfitDistributionItemPayment ordered by created_at asc
- markAsPaid(float $amount, string $paymentMethod, ?string $reference, ?string $note)
- markAsDeferred() / markAsReinvested() / cancelPayment() / reopenPayment()

### ProfitDistributionItemPayment.php

STATUS\_\* constants, statusLabel(), isTerminal(), canBeReopened(), isCancelled()

### InvestorProfitBalance.php

- findOrCreateForInvestment(Investment $investment) — idempotent
- creditEarned() / recordPayment() / recordDeferred() / recordReinvested()
- reversePayment() / reverseDeferred() / reverseReinvested() / reverseEarned()
- roi() = (total_earned / investment.amount) × 100
- hasPendingBalance() → bool

### ProfitDistributionEligibility.php

- determineEligibility(Investment, string $periodStart) → investment_date <= periodStart
- isManualOverride() → override_by !== null

### InvestorBalanceController.php

- show() loads distribution via separate withTrashed() query after pagination
  (eager load with column select does not support withTrashed in with() shorthand)

### ProfitPaymentController.php

- JSON responses (not Inertia); index/store/cancel/reopen
- store() handles: pay | defer | reinvest actions

### DistributionReverseController.php

- Single \_\_invoke(); wraps $distribution->reverse() in DB::transaction()

### ProfitDistributionController.php

- updateItemPayment() uses new markAsPaid(amount, method, reference, note) signature
- approve() wrapped in DB::transaction() with try/catch + Log::error

### SaleController.php

- store() returns response()->json([id, reference_no]) — NOT redirect()

### InvoiceController.php

- No policy — uses abort_unless(hasPermissionTo()) directly; withTrashed() on all queries

### ReportController.php

- dateRange() uses $request->filled(); expenses() never selects status column
- inventory() joins use products.category_id; export() handles profit-loss separately

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
- Step 17 Phase 1: Advanced Profit Distribution ✅

## PENDING MODULES

- Step 17 Phase 2: Capital Ledger
- Step 17 Phase 3: Investor Statements
- Step 17 Phase 4: Investment-to-Business Tracking
- Step 17 Phase 5: Sales Payment Upgrade
- Step 17 Phase 6: COD Support
- Step 18: Security Hardening
- Step 19: Performance Optimization
- Step 20: Testing

## NEXT STEP

Step 17 Phase 2 — Capital Ledger

---

## NEXT CHAT PROMPT

```
Project: Master POS System
Document Version: v2.0
Current Status: Step 17 Phase 1 ✅ COMPLETE
Next Step: Step 17 Phase 2 — Capital Ledger

[Paste full PROJECT_STATUS.md here]

We are starting Step 17 Phase 2 — Capital Ledger.

Capital and Profit must always remain separate ledgers.

Capital Ledger will track:
- Capital Deposit (new investment added to existing investor)
- Capital Withdrawal (admin approval required)
- Capital Reinvestment (profit converted to capital — links to Phase 1 reinvest)
- Capital Adjustment (admin correction with mandatory reason)
- Running Capital Balance per investor

Key principle: InvestorProfitBalance (Phase 1) handles profit only.
CapitalLedger (Phase 2) handles capital only. Never mix the two.

Existing files to check before coding (ask me to paste if needed):
- app/Models/Investment.php
- app/Models/InvestorProfitBalance.php (recordReinvested() already handles profit side)
- app/Models/ProfitDistributionItem.php (markAsReinvested() triggers profit side)
- database/migrations/*investments*
- routes/web.php

Please show the Module Analysis Checklist for Step 17 Phase 2 before writing any code.
Wait for my approval before starting.
