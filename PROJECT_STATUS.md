# Master POS System — Persistent Context File

# Paste this ENTIRE file at the start of every new chat.

---

## PROJECT IDENTITY

- Name: Master POS System
- Version: v1.5
- Current Step: Step 05 — Notification System ✅ COMPLETE
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

---

## ABSOLUTE CODING RULES (apply to every file, every step)

1. Create/Edit forms are ALWAYS in Modal — never separate pages
   (Exception: Product Create/Edit are separate pages — form too complex)
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
│ │ │ └── NotificationController.php
│ │ └── Requests/
│ │ └── Backend/
│ │ ├── StoreUserRequest.php
│ │ ├── UpdateUserRequest.php
│ │ ├── StoreProductCategoryRequest.php
│ │ ├── UpdateProductCategoryRequest.php
│ │ ├── StoreUnitRequest.php
│ │ ├── UpdateUnitRequest.php
│ │ ├── StoreProductRequest.php
│ │ └── UpdateProductRequest.php
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
│ │ └── ProductImage.php
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
│ │ └── NotificationPolicy.php
│ ├── Providers/
│ │ └── AppServiceProvider.php
│ └── Services/
│ └── ActivityLogService.php
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
│ ├── UnitSeeder.php
│ ├── ProductCategorySeeder.php
│ └── NotificationSeeder.php
├── resources/
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
│ │ └── Notifications/
│ │ └── Index.tsx
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

### Step 05 Tables

notifications → id(uuid), type, notifiable_type, notifiable_id,
data(json), read_at(nullable), timestamps

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

---

## SEEDERS RUN

- RolePermissionSeeder → Admin (Step 02 permissions), Staff (empty)
- Step03PermissionSeeder → Admin + Staff view-only
- Step04PermissionSeeder → Admin (all), Staff (view-only)
- Step05PermissionSeeder → Admin (all), Staff (view-only)
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
NotificationPolicy (model: DatabaseNotification::class)
Event listener: Login::class → RecordLoginHistory::class

### ActivityLogService.php

Usage: ActivityLogService::log('module', 'action', 'description', $id, $properties)

### confirm.ts

Usage: const ok = await confirmAction({ title, text, confirmButtonText })

### NotificationController.php

- Uses direct DatabaseNotification query (not auth()->user()->notifications() relation)
- Page prop name: 'notificationList' (not 'notifications') to avoid
  collision with globally shared notifications prop from HandleInertiaRequests

### HandleInertiaRequests.php

Shares globally: auth.user, flash, ziggy, notifications (unread_count + latest 8)

### Notification Classes (stub — triggers added in later steps)

- LowStockNotification → triggered in Step 07
- NewSaleNotification → triggered in Step 09
- NewExpenseNotification → triggered in Step 12

### ImageUploader.tsx

- Supports existing images (edit mode) + new uploads
- Max 8 images per product
- Star icon to set primary, trash to remove
- Primary image highlighted with indigo-500 border

### ProductFormFields.tsx

- Sectioned form: Basic Info / Pricing / Stock / Shipping / POS & Display / SEO
- Reusable Field + Toggle sub-components inside file
- Used by both Create.tsx and Edit.tsx

---

## COMPLETED MODULES

- Step 00: Project Standards ✅
- Step 01: Project Foundation ✅
- Step 02: Authentication & Permission ✅
- Step 03: Business Settings ✅
- Step 04: Product & Category Management ✅
- Step 05: Notification System ✅

## PENDING MODULES

- Step 06: Supplier Management
- Step 07: Purchase & Inventory
- Step 08: Customer Management
- Step 09: POS (Cart/Sale)
- Step 10: Invoice & Receipt
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

Step 06 — Supplier Management
