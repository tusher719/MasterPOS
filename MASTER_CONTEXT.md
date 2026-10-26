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

- **Sprint 1 — Auth & Core ✅ (Audited & Tested)**: 25 Auth/Profile tests, User & Role Management, Login histories, Activity logs, Light/Dark tokens.
- **Sprint 2 — Settings & Catalogue ✅ (Audited & Tested)**: Business settings, Payment methods, Expense categories, Investment types, Products, Categories, Units (no soft deletes), Slugs, Multi-image uploads, 26 Feature tests passing.
- **Sprint 3 — Purchases & Suppliers ✅ (Audited & Tested)**: Suppliers CRUD + UUID, Supplier ledger, Purchases (Draft → Received), Stock auto-increment, 11 Feature tests passing.
- **Sprint 4 — Sales & POS Terminal ✅ (Audited & Tested)**: POS Terminal, Cart sale, Hold orders drawer, Atomic hold deletion, Stock deduction on confirm, 4 Feature tests passing.
- **Sprint 5 — Finance, Reports & Invoices ✅ (Audited & Tested)**: Expenses + UUID, Investments, Profit calculations, PDF invoices via DomPDF, 10 Feature tests passing.
- **Sprint 6 — Inventory & Returns ✅ (Audited & Tested)**: Universal Import/Export (7 modules), Purchase Returns / Damage tracking (Draft → Confirmed with atomic stock decrement and movements), Dedicated purchase search endpoint (`/backend/purchases/search-for-return`), 4 Feature tests passing.
- **Sprint 7 — Executive Dashboard & Filter Modernization ✅ (Audited & Tested)**: Modernized executive header, KPI trend badges, PeriodFilter (`today`, `this_week`, `this_month`, `this_year`, `custom`), Light/Dark semantic tokens across all widgets, 6 Feature tests passing.
- **Sprint 8 — Public Storefront & POS Thermal Receipts ✅ (Audited & Tested)**: Public product catalog, Search page, Coming soon page, Persistent localStorage Cart Drawer (`useCart`), Guest checkout with dynamic delivery calculation, Stock deduction & `StockMovement` logging, Order confirmation slip with printable receipt, Live Order Tracking page (`/track-order`) with progress timeline & courier tracking, POS Counter 80mm/58mm thermal receipt printing layout with Code 128 SVG barcode and order tracking QR code (`qrcode.react` + `jsbarcode`), 9 Feature tests passing.

---

## Architecture & Data Standards

- **Hybrid UUID Architecture**: BigInt primary keys for high-performance MySQL InnoDB indexing and foreign key constraints + indexed unique `uuid` (UUIDv4) across all core business entities (`users`, `products`, `sales`, `purchases`, `purchase_returns`, `suppliers`, `expenses`, `investments`, `customers`, etc.).
- **Automated Test Coverage**: 108 passing tests (350 assertions) running against dedicated MySQL testing database (`masterpos_testing`).
- **Frontend Quality**: Zero TypeScript errors (`npx tsc --noEmit` clean) and production Vite build verified.

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
