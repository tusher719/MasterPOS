# Master POS System — Persistent Context File

# Paste this ENTIRE file at the start of every new chat.

---

## PROJECT IDENTITY

- Name: Master POS System
- Version: v2.0
- Current Step: Step 10 — Invoice & Receipt ✅ COMPLETE
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
    (adding Customer $customer causes ArgumentCountError when called
    with class string from controller)
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

---

## UI STANDARDS (never change)

- All pages use AuthenticatedLayout wrapper
- Native HTML elements only — NO shadcn/ui components in pages
- Color scheme: gray-50/100/200/300/400/500/600/700/800 + indigo-600/700
- Status badges: green-100/700 (active), gray-100/500 (inactive), amber-500 (warning)
- Page header: text-2xl font-bold text-gray-800
- Buttons: rounded-lg bg-indigo-600 text-white hover:bg-indigo-700
- Tables: rounded-lg border border-gray-200 bg-white overflow-hidden
- Table header: bg-gray-50 border-b border-gray-100 font-medium text-gray-500
- Stats cards: rounded-lg border border-gray-200 bg-white p-4
- Form inputs: rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500
- Modals: fixed inset-0 z-50 bg-black/40 → centered max-w-md bg-white rounded-lg shadow-xl
- Modal header: border-b border-gray-100 px-5 py-4
- Modal footer: border-t border-gray-100 px-5 py-4 flex justify-end gap-2
- Toggle: custom inline-flex h-6 w-11 rounded-full (indigo-600 / gray-200)
- Action buttons: rounded-md p-1.5 text-gray-400 hover:bg-gray-100 (edit) / hover:bg-red-50 hover:text-red-500 (delete)
- Form sections: rounded-lg border border-gray-200 bg-white p-5 with section headers
- Image uploader: grid-cols-4 thumbnail grid, border-2 indigo-500 for primary
- Sidebar nav group labels must be unique — no two groups share the same label
  (duplicate labels cause React key collision warnings)
- POS Terminal uses full viewport height layout (h-[calc(100vh-64px)])
  with 3-column split: product grid | cart | checkout panel

---

## EXACT FOLDER STRUCTURE

MasterPOS/
├── app/
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
│ │ │ └── InvoiceController.php
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
│ │ └── StoreSaleRequest.php
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
│ │ └── SaleItem.php
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
│ │ └── InvoicePolicy.php
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
│ ├── UnitSeeder.php
│ ├── ProductCategorySeeder.php
│ └── NotificationSeeder.php
├── resources/
│ ├── views/
│ │ └── pdf/
│ │ └── invoice.blade.php
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
│ │ │ ├── \_components/
│ │ │ │ ├── ProductStatsCards.tsx
│ │ │ │ ├── ProductTable.tsx
│ │ │ │ ├── ProductFormFields.tsx
│ │ │ │ └── ImageUploader.tsx
│ │ │ ├── Categories/
│ │ │ │ ├── Index.tsx
│ │ │ │ └── \_components/
│ │ │ │ ├── CategoryTable.tsx
│ │ │ │ └── CategoryModal.tsx
│ │ │ └── Units/
│ │ │ ├── Index.tsx
│ │ │ └── \_components/
│ │ │ ├── UnitTable.tsx
│ │ │ └── UnitModal.tsx
│ │ ├── Notifications/
│ │ │ └── Index.tsx
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
│ │ │ │ └── ReceiptModal.tsx
│ │ │ └── Sales/
│ │ │ ├── Index.tsx
│ │ │ ├── Show.tsx
│ │ │ └── \_components/
│ │ │ ├── SaleStatsCards.tsx
│ │ │ └── SaleTable.tsx
│ │ └── Invoices/
│ │ ├── Index.tsx
│ │ ├── Show.tsx
│ │ └── \_components/
│ │ ├── InvoiceTable.tsx
│ │ └── InvoicePrintView.tsx
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
│ └── notification.d.ts
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

**products table actual column names (critical):**

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
SupplierPolicy, PurchasePolicy, CustomerPolicy, SalePolicy
Event listener: Login::class → RecordLoginHistory::class
Note: InvoicePolicy NOT registered here — InvoiceController uses
abort_unless(hasPermissionTo()) directly

### ActivityLogService.php

Usage: ActivityLogService::log('module', 'action', 'description', $model, $properties)
Note: pass $model object, not $model->id

### confirm.ts

Usage: const ok = await confirmAction({ title, text, confirmButtonText })

### NotificationController.php

- Uses direct DatabaseNotification query (not auth()->user()->notifications() relation)
- Page prop name: 'notificationList' (not 'notifications') to avoid
  collision with globally shared notifications prop from HandleInertiaRequests

### HandleInertiaRequests.php

Shares globally: auth.user, flash, ziggy, notifications (unread_count + latest 8)

### SupplierController.php

- Always passes 'can' array to Inertia::render() for permission-gated UI
- Restore uses onlyTrashed()->findOrFail($id) — not route model binding

### CustomerController.php

- Same pattern as SupplierController
- Stats: total, active, inactive, total_balance (sum of opening_balance)
- Filters: search (name/email/phone/city), status, trashed

### SaleController.php

- index() eager loads Product with 'images' relation, maps image_path (NOT 'path')
- store() returns response()->json([id, reference_no]) — NOT redirect()
  (POS Index uses axios.post() for checkout, needs JSON response)
- destroy() reverses stock via SaleStockService::reverseStock()
- restore() re-applies stock via SaleStockService::reApplyStock()
- salesList() → renders Backend/POS/Sales/Index
- show() → renders Backend/POS/Sales/Show
- All Gate::allows() used for can array (not Auth::user()->can())

### InvoiceController.php

- No policy registration — uses abort_unless(hasPermissionTo()) directly
- index() → paginated list with filters (search/payment_status/date_from/date_to)
- show() → single invoice with business settings, renders Backend/Invoices/Show
- pdf() → DomPDF download via resources/views/pdf/invoice.blade.php
- withTrashed() on all queries — voided invoices still visible in list
- Stats: total, paid, partial, due (all withTrashed)

### pdf/invoice.blade.php

- Uses DejaVu Sans font (DomPDF Unicode support)
- Logo loaded via public_path('storage/...') — NOT URL
- CSS Grid NOT used — flexbox + HTML tables only (DomPDF limitation)
- currency_symbol from BusinessSetting, fallback '৳'
- Discount/tax rows conditional — only shown when value > 0

### SaleStockService.php

- applyStock() → deduct stock_qty per item, log stock_movements type:sale
- reverseStock() → restore stock on void, log type:return
- reApplyStock() → re-deduct on restore, log type:sale
- checkLowStock() → fires LowStockNotification if stock_qty ≤ low_stock_threshold

### SalePolicy.php

- delete() and restore() have NO model instance parameter
  (controller calls can('delete', Sale::class) with class string)

### Sale.php

- generateReference() → SL-YYYYMMDD-XXXX format
- scopeActive() → whereNull('deleted_at')
- Relations: customer (withTrashed), paymentMethod (withTrashed),
  creator (withTrashed), items (hasMany SaleItem)

### SaleItem.php

- Relations: sale, product (withTrashed)

### POS/Index.tsx

- 3-column layout: ProductGrid | CartSidebar | CheckoutPanel
- axios.post() for checkout (not Inertia router)
- ReceiptModal shown after successful sale (built from cart state + response)
- handleNewSale() clears all state + router.reload({ only: ['products'] })

### POS/\_components/ProductGrid.tsx

- Product interface includes: barcode, description, weight, weight_unit,
  is_featured, is_taxable, discount_type, discount_value, min_sale_qty,
  image (string|null), images (string[])
- Info button (ℹ) opens ProductDetailModal on click (stopPropagation)
- Click on card → handleAdd() with pulse animation

### POS/\_components/ProductDetailModal.tsx

- Image slider with prev/next chevrons + dot indicators
- Shows discounted price when discount_type/discount_value set
- Add to Cart button → onAddToCart + onClose

### POS/\_components/CartItem.tsx

- Leave animation: setIsLeaving(true) → CSS transition → onTransitionEnd calls onRemove()
- Per-item discount input capped at unit_price × quantity

### POS/\_components/CheckoutPanel.tsx

- Customer/PaymentMethod select, discount/tax inputs
- Quick fill: Full / Half / None buttons for paid amount
- paymentStatus computed: paid/partial/due

### POS/\_components/ReceiptModal.tsx

- Shows after successful sale
- Print button → window.print()
- New Sale button → handleNewSale()

### Invoices/Index.tsx

- Stats cards: total, paid, partial, due
- Filters: search (reference_no/customer name), payment_status, date_from, date_to
- Voided invoices shown with red background + VOIDED badge
- Walk-in customer shown as italic "Walk-in Customer"
- PDF download button: visible only when can.print + not voided

### Invoices/Show.tsx

- Business logo, name, address from BusinessSetting
- Invoice number = reference_no (font-mono, indigo)
- Bill To block + Payment Method
- Itemized table: name, SKU, qty, unit price, discount, subtotal
- Totals: subtotal → discount → tax → grand total → paid → due
- Print CSS via <style> tag — @media print hides nav/sidebar/action bar
- Download PDF button: can.print + not deleted_at

### PurchaseController.php

- Bulk actions use Auth::user()->hasPermissionTo() directly
- Restore uses onlyTrashed()->findOrFail($id)
- Stock only applied when purchase_status = received or partial_received

### PurchaseStockService.php

- Uses stock_qty column — always cast to (int) before math
- Uses low_stock_threshold column (NOT low_stock_alert)

### Product.php

- scopeActive() → where('is_active', true)
- Actual columns: cost_price, stock_qty, low_stock_threshold

### AuthenticatedLayout.tsx

- NAV_ITEMS includes:
    - Point of Sale group: POS Terminal + Sales History
    - Invoices group: Invoice List
- FileText icon imported from lucide-react for Invoices group

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

## PENDING MODULES

- Step 11: Orders
- Step 12: Expense Management
- Step 13: Investment Management
- Step 14: Profit Distribution
- Step 15: Dashboard & Analytics
- Step 16: Reports
- Step 17: Security Hardening
- Step 18: Performance Optimization
- Step 19: Testing

## NEXT STEP

Step 11 — Orders
