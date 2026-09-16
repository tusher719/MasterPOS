# MasterPOS — Master Context

_Last updated: Sprint 6 complete → Sprint 8 starting_

## Project Overview

Full-stack POS + ERP system

- **Local path:** D:/xampp/htdocs/Laravel_12/MasterPOS
- **GitHub:** tusher719/MasterPOS
- **Dev OS:** Windows 10, XAMPP
- **Stack:** Laravel 12 + React 18 + Inertia.js + TypeScript + Tailwind + MySQL

---

## Tech Stack Details

| Layer    | Tech                                      |
| -------- | ----------------------------------------- |
| Backend  | Laravel 12, Spatie Permission             |
| Frontend | React 18, TypeScript, Inertia.js          |
| Styling  | Tailwind CSS                              |
| DB       | MySQL (XAMPP)                             |
| Excel    | maatwebsite/excel ^3.1                    |
| Sessions | Database driver                           |
| Icons    | Lucide React                              |
| Alerts   | Sonner (toast), SweetAlert2               |
| Date     | AppDateInput / AppDateRangeInput (custom) |

---

## Surfaces

| Surface           | URL Prefix   | Auth             |
| ----------------- | ------------ | ---------------- |
| Backend Admin     | /backend     | Auth + Role      |
| POS               | /backend/pos | Auth + Role      |
| Public Storefront | / (root)     | Guest (Sprint 8) |

---

## Roles & Permissions

- **Admin** — full access to all modules
- **Staff** — limited access per module (view only by default)
- Permissions seeded per module via individual Seeders
- Spatie Permission — guard: web

---

## Completed Sprints

### Sprint 1 — Auth & Core ✅

- Login, Registration, Email Verification
- AuthenticatedLayout, GuestLayout
- User Management (CRUD + roles)
- Role Management (Spatie)

### Sprint 2 — Settings & Catalogue ✅

- Business Settings (logo, name, currency, timezone)
- Products (CRUD, variants, stock, images)
- Categories, Units
- Suppliers

### Sprint 3 — Purchases ✅

- Purchase Orders (Draft → Partial Received → Received → Cancelled)
- Purchase Items, Purchase Payments
- Supplier ledger (opening balance)
- Stock movements on receive

### Sprint 4 — Sales & POS ✅

- Sales (Draft → Confirmed → Cancelled)
- Sale Items, Sale Payments
- POS interface (Hold orders, quick sale)
- Customer management
- Stock deduction on confirm

### Sprint 5 — Finance & Reports ✅

- Expenses + Expense Categories
- Investments, Investment Types, Investor Balance
- Profit Calculation, Profit Distribution, Profit Payment
- Partners, Partner Profit Rules, Partner Settlement
- Capital Ledger, Capital Withdrawal
- Invoices (PDF via DomPDF)
- Reports (Sales, Purchase, Expense, Stock)
- Activity Logs, Audit Trail
- Quick Links
- Legal Pages
- Feature Announcements
- Fraud Flags
- Fulfillment (Order Tasks, Pre-Orders)
- Staff Performance Report
- Notification system
- User Preferences
- Global Search

### Sprint 6 — Inventory & Returns ✅

#### Item 3.6 — Universal Import/Export ✅

- Route: /backend/import (ImportController)
- 7 modules: products, categories, units, customers, suppliers,
  expense_categories, payment_methods
- Tables: import_logs (tracks both imports and exports)
- maatwebsite/excel ^3.1, ext-zip enabled in php.ini
- Flow: Dry-run → Preview → Confirm
- History: Admin sees all, Staff sees own

#### Item 3.7 — Purchase Return / Damage Tracking ✅

- Route: /backend/purchase-returns (PurchaseReturnController)
- Tables: purchase_returns, purchase_return_items
- Return types: supplier_return | damage_wastage
- Flow: Draft → Confirmed (stock deducted ONLY on confirm)
- Stock movements: reference_type = 'purchase_return', type = 'return'
- Quantity guard: return qty ≤ original qty − already-returned qty
- Confirmed returns cannot be deleted (soft delete only on draft)
- Permissions: purchase_return.view / create / confirm / delete
    - Admin: all, Staff: view only
- ⚠️ PENDING FIX: CreateReturnModal purchase search broken
  (Inertia JSON conflict — needs dedicated /purchases/search-for-return route)
  Solution planned:
    - New route: GET /backend/purchases/search-for-return
    - New method: PurchaseController::searchForReturn()
    - Update CreateReturnModal fetch URL

---

## Active Sprint: Sprint 8 — Public Storefront

### Planned Items

| Item | Feature                  | Status  |
| ---- | ------------------------ | ------- |
| 10.1 | Public Product Catalog   | 🔲 Next |
| 10.2 | Website Settings / CMS   | 🔲      |
| 10.3 | Hero / Banner Management | 🔲      |
| 10.4 | Cart                     | 🔲      |
| 10.5 | Checkout                 | 🔲      |
| 10.6 | Order Tracking           | 🔲      |
| 10.7 | Storefront Layout + Nav  | 🔲      |

---

## Key Coding Rules (never break)

### Model Rules

- **Unit model** — NO SoftDeletes, never withTrashed() on Unit
- **Rule 66** — status / confirmed_by / confirmed_at excluded from $fillable
  → Always set via forceFill() in a dedicated model method (e.g. confirm())
- **Rule 3** — Policy methods take NO model parameter
  (causes ArgumentCountError when called with class string)
- Products with SoftDeletes — always withTrashed() in relations

### Controller Rules

- Authorization via Gate::allows() / abort_unless() — never middleware-only
- Restore routes declared BEFORE wildcard routes to prevent swallowing
- Always load relations with specific column selects (e.g. supplier:id,name)

### Migration Rules

- nullOnDelete() for nullable FKs to users (confirmed_by, updated_by etc.)
- restrictOnDelete() for required FKs (created_by, product_id etc.)
- cascadeOnDelete() for child tables (items, payments etc.)
- Always add indexes for filter columns (status, type, date, FK columns)

### Frontend Rules

- decimal fields from backend always wrap in Number() before arithmetic
- All modals use fixed inset-0 z-50 overlay pattern
- Filters use preserveScroll: true, replace: true
- Toast via sonner, confirm dialogs via SweetAlert2
- AppDateInput / AppDateRangeInput for all date fields

### Windows / Git Rules

- After adding new controller files: composer dump-autoload -o FIRST
- Then: php artisan route:cache
- Windows case-sensitive rename: use temp name intermediate step
- Never php artisan route:cache before composer dump-autoload

---

## Known Issues / Tech Debt

| #   | Issue                        | File                                 | Fix                       |
| --- | ---------------------------- | ------------------------------------ | ------------------------- |
| 1   | 500 handler commented out    | bootstrap/app.php                    | Restore Throwable block   |
| 2   | Windows filename case        | Staffperformancereportcontroller.php | git mv via temp           |
| 3   | Windows filename case        | Legalpageseeder.php                  | git mv via temp           |
| 4   | Purchase Return modal search | CreateReturnModal.tsx                | Dedicated search endpoint |

---

## Important File Locations

### Backend

| Purpose     | Path                          |
| ----------- | ----------------------------- |
| Routes      | routes/web.php                |
| Controllers | app/Http/Controllers/Backend/ |
| Models      | app/Models/                   |
| Policies    | app/Policies/                 |
| Requests    | app/Http/Requests/Backend/    |
| Seeders     | database/seeders/             |
| Migrations  | database/migrations/          |
| Middleware  | app/Http/Middleware/          |
| Services    | app/Services/                 |

### Frontend

| Purpose      | Path                                  |
| ------------ | ------------------------------------- |
| Pages        | resources/js/Pages/Backend/           |
| Public Pages | resources/js/Pages/Public/ (Sprint 8) |
| Layouts      | resources/js/Layouts/                 |
| Components   | resources/js/Components/              |
| Types        | resources/js/types/                   |
| Hooks        | resources/js/hooks/                   |

---

## Database Notes

- All tables use id (bigIncrements), timestamps, softDeletes (except Unit)
- Stock tracked in products.stock_qty and product_variants.stock_qty
- All money fields: decimal(10,2)
- All quantity fields: decimal(10,2)
- Enum fields used for status, type columns (not string)
- Sessions, cache, jobs all in DB (not file/redis)
