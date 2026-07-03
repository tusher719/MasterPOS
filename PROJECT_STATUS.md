# Master POS System — Persistent Context File

# Paste this ENTIRE file at the start of every new chat.

---

## PROJECT IDENTITY

- Name: Master POS System
- Version: v1.3
- Current Step: Step 03 — Business Settings ✅ COMPLETE
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

---

## EXACT FOLDER STRUCTURE

```
MasterPOS/
├── app/
│   ├── Enums/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Backend/         ← all admin controllers go here
│   │   │   │   ├── UserController.php
│   │   │   │   ├── RoleController.php
│   │   │   │   ├── LoginHistoryController.php
│   │   │   │   ├── ActivityLogController.php
│   │   │   │   ├── SettingController.php
│   │   │   │   ├── PaymentMethodController.php
│   │   │   │   ├── ExpenseCategoryController.php
│   │   │   │   └── InvestmentTypeController.php
│   │   │   └── Api/             ← future REST API (empty now)
│   │   ├── Requests/
│   │   │   └── Backend/         ← ALL form requests go here
│   │   │       ├── StoreUserRequest.php
│   │   │       └── UpdateUserRequest.php
│   │   └── Middleware/
│   ├── Listeners/
│   │   └── RecordLoginHistory.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── LoginHistory.php
│   │   ├── ActivityLog.php
│   │   ├── BusinessSetting.php
│   │   ├── PaymentMethod.php
│   │   ├── ExpenseCategory.php
│   │   └── InvestmentType.php
│   ├── Notifications/           ← empty, used from Step 04
│   ├── Observers/               ← empty, used later
│   ├── Policies/
│   │   ├── UserPolicy.php
│   │   ├── RolePolicy.php
│   │   ├── SettingPolicy.php
│   │   ├── PaymentMethodPolicy.php
│   │   ├── ExpenseCategoryPolicy.php
│   │   └── InvestmentTypePolicy.php
│   ├── Providers/
│   │   └── AppServiceProvider.php  ← policies + event listeners registered here
│   └── Services/
│       └── ActivityLogService.php
├── database/
│   ├── migrations/
│   ├── seeders/
│   │   ├── DatabaseSeeder.php
│   │   ├── RolePermissionSeeder.php
│   │   ├── BusinessSettingSeeder.php
│   │   ├── PaymentMethodSeeder.php
│   │   ├── ExpenseCategorySeeder.php
│   │   └── InvestmentTypeSeeder.php
│   └── factories/
├── resources/
│   └── js/
│       ├── app.tsx              ← Toaster from sonner added here
│       ├── Components/
│       │   ├── shared/          ← reusable components
│       │   │   ├── DataTable.tsx
│       │   │   └── Modal.tsx
│       │   └── ui/              ← shadcn auto-generated (never edit manually)
│       ├── hooks/
│       │   └── useFlashToast.ts
│       ├── Layouts/
│       │   └── AuthenticatedLayout.tsx  ← sidebar + topbar layout
│       ├── lib/
│       │   ├── utils.ts         ← shadcn cn() utility
│       │   └── confirm.ts       ← SweetAlert2 wrapper
│       ├── Pages/
│       │   └── Backend/         ← ALL admin pages go here
│       │       ├── Users/
│       │       │   └── Index.tsx
│       │       ├── Roles/
│       │       │   └── Index.tsx
│       │       ├── LoginHistories/
│       │       │   └── Index.tsx
│       │       ├── ActivityLogs/
│       │       │   └── Index.tsx
│       │       └── Settings/    ← Step 03 pages go here
│       │           ├── Index.tsx
│       │           ├── PaymentMethods.tsx
│       │           ├── ExpenseCategories.tsx
│       │           └── InvestmentTypes.tsx
│       └── types/
│           ├── user.d.ts
│           ├── role.d.ts
│           └── log.d.ts
├── routes/
│   └── web.php
├── PROJECT_STATUS.md            ← this file
├── PROJECT_OVERVIEW.md
├── DATABASE_SCHEMA.md
├── CHANGELOG.md
└── API_REFERENCE.md
```

---

## INERTIA PAGE RENDER RULE

```
Controller renders:  Inertia::render('Backend/Users/Index', [...])
File must exist at:  resources/js/Pages/Backend/Users/Index.tsx
```

Capital B in Backend, capital first letter of each subfolder.
shadcn components import from: @/components/ui/... (lowercase)
Custom shared components: @/Components/shared/... (uppercase C)

---

## DATABASE — COMPLETED TABLES

### Step 02 Tables

```
users              → id, name, email, phone, status(enum), avatar,
                     email_verified_at, password, remember_token,
                     deleted_at, timestamps
login_histories    → id, user_id(FK), ip_address, user_agent,
                     logged_in_at, timestamps
activity_logs      → id, user_id(FK nullable), module, action,
                     subject_type, subject_id, description,
                     properties(json), timestamps
```

Spatie tables (auto): roles, permissions, model_has_roles,
model_has_permissions, role_has_permissions

### Step 03 Tables

```
business_settings  → id, key(unique), value(text), group(varchar 50),
                     timestamps
payment_methods    → id, name, type(enum:cash,card,mobile_banking,other),
                     is_active, sort_order(tinyint), deleted_at, timestamps
expense_categories → id, name, description, color(varchar 7),
                     is_active, deleted_at, timestamps
investment_types   → id, name, description, is_active,
                     deleted_at, timestamps
```

---

## ROUTES — REGISTERED

### Step 02 Routes

```
GET    /backend/users                    → backend.users.index
POST   /backend/users                    → backend.users.store
PUT    /backend/users/{user}             → backend.users.update
DELETE /backend/users/{user}             → backend.users.destroy
GET    /backend/roles                    → backend.roles.index
POST   /backend/roles                    → backend.roles.store
PUT    /backend/roles/{role}/permissions → backend.roles.permissions
DELETE /backend/roles/{role}             → backend.roles.destroy
GET    /backend/login-histories          → backend.login-histories.index
GET    /backend/activity-logs            → backend.activity-logs.index
```

### Step 03 Routes (may need fixes — see below)

```
GET    /backend/settings                           → backend.settings.index
POST   /backend/settings                           → backend.settings.update
POST   /backend/settings/logo                      → backend.settings.logo
GET    /backend/payment-methods                    → backend.payment-methods.index
POST   /backend/payment-methods                    → backend.payment-methods.store
PUT    /backend/payment-methods/{paymentMethod}    → backend.payment-methods.update
DELETE /backend/payment-methods/{paymentMethod}    → backend.payment-methods.destroy
GET    /backend/expense-categories                 → backend.expense-categories.index
POST   /backend/expense-categories                 → backend.expense-categories.store
PUT    /backend/expense-categories/{expenseCategory} → backend.expense-categories.update
DELETE /backend/expense-categories/{expenseCategory} → backend.expense-categories.destroy
GET    /backend/investment-types                   → backend.investment-types.index
POST   /backend/investment-types                   → backend.investment-types.store
PUT    /backend/investment-types/{investmentType}  → backend.investment-types.update
DELETE /backend/investment-types/{investmentType}  → backend.investment-types.destroy
```

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

---

## SEEDERS RUN

- RolePermissionSeeder → Admin role (all permissions), Staff role (empty)
- Default admin: admin@masterpos.test / password
- BusinessSettingSeeder → default key-value settings
- PaymentMethodSeeder → Cash, Card, bKash, Nagad, Rocket
- ExpenseCategorySeeder → 8 categories
- InvestmentTypeSeeder → 6 types

---

## KEY FILES — IMPORTANT IMPLEMENTATIONS

### AppServiceProvider.php

Registers: UserPolicy, RolePolicy, SettingPolicy,
PaymentMethodPolicy, ExpenseCategoryPolicy, InvestmentTypePolicy
Event listener: Login::class → RecordLoginHistory::class

### ActivityLogService.php (app/Services/)

Usage: ActivityLogService::log('module', 'action', 'description', $model)

### confirm.ts (resources/js/lib/)

Usage: const ok = await confirmAction({ title, text, confirmButtonText })

### useFlashToast.ts (resources/js/hooks/)

Used in AuthenticatedLayout — auto-shows sonner toast on flash messages

### AuthenticatedLayout.tsx

- Collapsible sidebar with lucide icons
- Disabled (greyed) menu items for unimplemented routes
- Bell icon placeholder (Step 04 notification)
- User avatar + logout button in topbar

---

## STEP 03 — KNOWN ISSUES (needs fixing in this chat)

1. Form Requests placed in wrong folders
    - Wrong: app/Http/Requests/Setting/...
    - Wrong: app/Http/Requests/PaymentMethod/...
    - Correct: app/Http/Requests/Backend/...
2. AuthServiceProvider referenced but doesn't exist in Laravel 12
    - Policies must be registered in AppServiceProvider via Gate::policy()
3. SettingController ActivityLogService::log() called with wrong argument order
    - Wrong: log('updated', 'BusinessSetting', null, [...])
    - Correct: log('settings', 'updated', 'Settings updated', null, [...])
4. Settings page React file path wrong
    - Wrong: resources/js/pages/Settings/Index.tsx (lowercase p)
    - Correct: resources/js/Pages/Backend/Settings/Index.tsx
5. Inertia::render path wrong in SettingController
    - Wrong: Inertia::render('Settings/Index', ...)
    - Correct: Inertia::render('Backend/Settings/Index', ...)
6. Same path issue for PaymentMethods, ExpenseCategories, InvestmentTypes
7. Step03PermissionSeeder references 'super-admin' and 'admin' roles
    - Actual roles in DB: 'Admin', 'Staff' (case sensitive)
8. Sidebar has no links to Settings, Payment Methods, etc. yet

---

## COMPLETED MODULES

- Step 00: Project Standards ✅
- Step 01: Project Foundation ✅
- Step 02: Authentication & Permission ✅
- Step 03: Business Settings ⚠️ (code generated, fixes needed)

## PENDING MODULES

- Step 04: Notification System
- Step 05: Product Module
- Step 06: Inventory
- Step 07: Customer
- Step 08: POS (Cart/Sale)
- Step 09: Invoice
- Step 10: Orders
- Step 11: Expense
- Step 12: Investment
- Step 13: Profit Distribution
- Step 14: Dashboard
- Step 15: Reports
- Step 16: Security Hardening
- Step 17: Performance Optimization
- Step 18: Testing

## NEXT STEP

Step 03 Fix → then Step 04: Notification System
