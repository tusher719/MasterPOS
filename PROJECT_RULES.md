# Project Rules — Master Business Suite

> Permanent coding rules. Apply to every file, every step, every phase.

---

## 1. General Development Rules

- **STEP BY STEP ONLY** — never write next module unless explicitly asked
- **One file at a time** — deliver files sequentially, user types "next" to continue
- All code comments and documentation: **English only**, never Bengali
- Git commit messages: **short, one line**
- Every DB table must have: `id`, `timestamps`. Soft-deletable tables add `deleted_at`
- Money/price fields: **decimal(10,2)** — never float
- ActivityLogService::log() on **every** create/update/delete operation

---

## 2. Controller Patterns

### Authorization

- Standard modules: `abort_unless(Gate::allows('permission.name'), 403)`
- InvoiceController: `abort_unless(hasPermissionTo())` directly — no policy registration
- ReportController: `Gate::allows()` + `abort_unless()` pattern
- InvestmentController: `Gate::allows()` + `abort_unless()` pattern
- ProfitDistributionController: `optional(Auth::user())->can()` pattern
- HoldOrderController: `AuthorizesRequests` trait + `$this->authorize('edit', $holdOrder)`
    - update() must pass ability name 'edit' explicitly — policy has no update() method
- PartnerController: `abort_unless(Gate::allows('permission.name'), 403)` pattern
- PartnerProfitRuleController: `abort_unless(Gate::allows('permission.name'), 403)` pattern

### can[] Array

- Always pass `can` array from controller to `Inertia::render()`
- Bulk actions: authorized via `Auth::user()->hasPermissionTo()` directly
  (Gate::denies() with class-level policy unreliable for bulk)

### Restore Pattern

- Always use `onlyTrashed()->findOrFail($id)` — never route model binding for restore

### SaleController Special Rule

- `store()` must return `response()->json([id, reference_no])` — NOT redirect()
  (POS Index uses axios.post() for checkout)

### Profit Calculation Controllers

- `calculatePreview()` must detect `source_type` (investment_based vs partner_based) and dispatch to correct engine
- Never mix investment-based and partner-based calculations in a single query

---

## 3. Policy Rules

- Policies registered **only** via `Gate::policy()` in AppServiceProvider
- Policy methods that only check permission (no model instance) must **NOT** have a model parameter
  (Adding model param causes ArgumentCountError when called with class string)
- InvoicePolicy NOT registered in AppServiceProvider — InvoiceController uses direct permission check
- ReportController has NO policy — uses Gate::allows() directly
- PartnerPolicy: standard registration via Gate::policy() in AppServiceProvider
- PartnerProfitRulePolicy: standard registration — approve() method required (separate from edit)

---

## 4. Route Rules

- Permission format: `module.action` (e.g. `products.view`)
- Route name format: `backend.{module}.{action}`
- `Route::resource()` inside named group must NOT use `->names([])` with 'backend.' prefix
  (group adds it automatically — would create duplicate prefix)
- Restore route must use `->name('customers.restore')` not `->name('backend.customers.restore')`
- Export routes declared **BEFORE** resource() to prevent wildcard swallowing
- Dashboard data route declared **BEFORE** resource routes
- Report export route declared **BEFORE** named report routes
- Partner profit rule approval route declared **BEFORE** resource routes

---

## 5. Form & Modal Rules

- Create/Edit forms are **ALWAYS in Modal** — never separate pages
    - **Exceptions:** Product, Purchase, ProfitDistribution Create/Edit — separate pages (forms too complex)
    - Partner Create/Edit: Modal (simple form)
    - ProfitRule Create/Edit: Modal (versioning handled server-side)
    - ProductAssignment Create/Edit: Modal
- Toast notifications: **sonner only**
- Confirm dialogs: **SweetAlert2 only**
- SweetAlert2 `confirmButtonColor`: `'#ef4444'` for delete actions
- `confirmAction()` handlers use `.then()` pattern — **NOT async/await**
  (Inertia router callbacks incompatible with async event handlers in some React versions)

---

## 6. Frontend / TypeScript Rules

### Decimal Fields

- Decimal fields from Laravel serialize as strings in JSON
- Always wrap in `Number()` on frontend — never use directly in arithmetic
- `handleResumeHoldOrder()` must normalize ALL numeric fields with Number()

### Date Fields

- Laravel 'date' cast returns full ISO datetime string
- Edit.tsx date fields must use `toDateInputValue()` helper → slice to `[0,10]` for `<input type="date">`
- Without this, date inputs render blank on edit page load
- Effective dates (effective_from, effective_to) follow the same rule

### Ziggy Routes

- Use named parameter syntax: `route('backend.profit-distributions.show', { profit_distribution: id })`
- Never pass plain ID for routes that have named parameters

### TypeScript Interfaces

- Paginator meta destructuring must use safe fallbacks: `data ?? []`, `meta ?? {}`, `links ?? []`
- ItemData / PreviewItem interfaces require index signature: `[key: string]: string | number | null`
  (needed when arrays are passed through Inertia router.post() payload)
- ProfitDistribution shared types: `resources/js/types/profit-distribution.d.ts`
- Partner shared types: `resources/js/types/partner.d.ts`
- Runtime color/label maps: `resources/js/types/partner-colors.ts` (never inside .d.ts)

### React Patterns

- CartItem has leave animation via `onTransitionEnd` (not direct onRemove)
- Large pages split into `_components/` subfolder

---

## 7. Laravel Model Rules

### Mass Assignment — Critical (Rule 66)

- `ProfitDistributionItem.payment_status` is excluded from `$fillable`
- `ProfitDistribution` excludes from `$fillable`: `status`, `is_locked`, `approved_by`, `approved_at`, `distributed_by`, `distributed_at`
- `ProfitDistributionItem` excludes from `$fillable`: `payment_status`, `payment_method`, `transaction_reference`, `paid_by`, `paid_at`
- Always use `forceFill([...])->save()` for these fields — never `update([])`
- `PartnerProfitRule` excludes from `$fillable`: `approved_by`, `approved_at`
  → use `forceFill()->save()` in approval action
- `PartnerProductAssignment` excludes from `$fillable`: `approved_by`, `approved_at`
  → use `forceFill()->save()` in approval action

### Soft Delete & Relations

- `withTrashed()` on BelongsTo relations where source may be soft-deleted
- InvoiceController uses `withTrashed()` on all queries
- ActivityLog must have `user()` BelongsTo with `withTrashed()`
- Partner model: `withTrashed()` on any relation where partner may be soft-deleted

### Eager Loading with withTrashed

- Eager load with column select does NOT support `withTrashed()` in `with()` shorthand
- InvestorBalanceController.show() loads distribution via separate `getCollection()->load()` call after pagination

### Accessors

- `Investment::attachment_url` accessor must be explicitly appended via `$investment->append(['attachment_url'])`
  (without this, JSON serialization drops it)

---

## 8. Database Query Rules

- `expenses` table has **NO status column** — never select or filter by `expenses.status`
- `products` FK to categories is `category_id` NOT `product_category_id`
- `dateRange()` helper uses `$request->filled()` not `$request->input()` with default
  (Laravel ConvertEmptyStringsToNull middleware converts empty strings to null)
- `ProfitDistribution::generateDistributionNo()` must be called inside `DB::transaction()` with `lockForUpdate()`
- `calculatePreview()` sums ALL expenses in period — no status filter (no approval workflow)
- Profit rule resolution: always query by `effective_from <= period_start AND (effective_to IS NULL OR effective_to >= period_start)`
- Pending profit rules (`approved_by IS NULL`) must NEVER be included in any profit calculation
- Partner eligibility check: eligibility record must cover ENTIRE distribution period, not just partial overlap
- `PartnerEligibilityService::isEligible()` is the single authoritative eligibility check —
  never duplicate this query in controllers or other services
- Nested route names always include outer group prefix —
  verify with `php artisan route:list --name=` before using in frontend components

---

## 9. PDF Rules

- PDF Blade templates use `public_path('storage/...')` for logo — dompdf requires server filesystem path, not URL
- **DomPDF does NOT support CSS Grid** — use flexbox or HTML tables only in Blade templates
- Report PDF templates: DejaVu Sans font, flexbox only, A4 landscape
- `$rows` in report Blade templates is a Laravel Collection — use `.sum()`, `.count()`, `.where()` directly

---

## 10. Security Rules

- SecurityHeaders middleware applied globally via bootstrap/app.php
- CSP allows: `fonts.bunny.net`, `fonts.googleapis.com`, `fonts.gstatic.com`, `localhost:5173` (local only)
- IPv6 `[::1]` is NOT valid in CSP — vite.config.js must force `host: 'localhost'`
- ValidateSortColumn middleware: per-module allowlists prevent SQL injection via orderBy
- Session: `SESSION_ENCRYPT=true`, `SESSION_HTTP_ONLY=true`, `SESSION_SAME_SITE=lax`
- `SESSION_SECURE_COOKIE=false` for local HTTP; `true` for production HTTPS
- Rate limiting:
    - `pos.sales.store` → throttle:30,1
    - `invoices.pdf` → throttle:30,1
    - `investments.export` → throttle:20,1
    - `reports.export` → throttle:20,1
    - `settings.logo` → throttle:10,1

---

## 11. UI Standards

### Layout

- All pages use `AuthenticatedLayout` wrapper
- **Native HTML elements only** — NO shadcn/ui components in pages
- Show/Detail pages: `lg:grid-cols-3` — main content `lg:col-span-2`, sidebar 1 col
- POS Terminal: full viewport height `h-[calc(100vh-64px)]`, 3-column split

### Colors & Components

- Color scheme: `gray-50/100/200/300/400/500/600/700/800` + `indigo-600/700`
- Status badges: `green-100/700` (active), `gray-100/500` (inactive), `amber-100/700` (processing/withdrawn)
- Partner type badges: `blue-100/700` (capital), `purple-100/700` (working), `orange-100/700` (product)
- Page header: `text-2xl font-bold text-gray-800`
- Primary buttons: `rounded-lg bg-indigo-600 text-white hover:bg-indigo-700`
- Tables: `rounded-lg border border-gray-200 bg-white overflow-hidden`
- Table header: `bg-gray-50 border-b border-gray-100 font-medium text-gray-500`
- Stats cards: `rounded-lg border border-gray-200 bg-white p-4`
- Form inputs: `rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500`
- Action buttons: `rounded-md p-1.5 text-gray-400 hover:bg-gray-100` (edit) / `hover:bg-red-50 hover:text-red-500` (delete)
- Approval pending badge: `yellow-100/700`
- Rule version badge: `indigo-100/700`

### Modals

- `fixed inset-0 z-50 bg-black/40` → centered `max-w-md bg-white rounded-lg shadow-xl`
- Header: `border-b border-gray-100 px-5 py-4`
- Footer: `border-t border-gray-100 px-5 py-4 flex justify-end gap-2`
- EditModal inside drawer: `z-[60]` to render above drawer

### Dashboard Sections

- Section wrapper: `rounded-lg border border-gray-200 bg-white`
- Section header: `border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-700`
- Section body: `p-5`
- NeedsAttention: amber-50 bg, amber-200 border — returns null when all counts zero

### Reports

- 3-column card grid; `COLOR_MAP` object keeps Tailwind classes static (prevents PurgeCSS stripping)
- Report KPI cards: `border-l-4` accent color per metric category
- Print: `print:hidden` on filters/export bar; `print:block` title block with period range

### Mantine Usage (selective — not for general UI)

- `@mantine/dates` → date pickers in forms only
- `@mantine/carousel` → image sliders only
- `@mantine/tiptap` → rich text notes fields only
- `@mantine/charts` → charts in investor/capital/partner pages only
- Page layout, tables, buttons, modals → always native HTML + Tailwind

### Mantine Usage (selective — STRICT RULE)

Mantine v8 IS installed. Use it for these cases ONLY:

- `@mantine/dates` → DatePickerInput for date fields in forms
  (effective_from, effective_to, profit_start_date, period_start, period_end etc.)
- `@mantine/carousel` → image sliders (product images)
- `@mantine/tiptap` → rich text notes fields
- `@mantine/charts` → AreaChart, BarChart in investor/capital/partner analytics pages

DO NOT use Mantine for:

- Page layout, grid, containers
- Tables, thead, tbody, tr, td
- Buttons, links, badges, tags
- Modals, drawers, overlays
- Form inputs (text, select, textarea, checkbox, radio) — use native HTML
- Any general UI element — always native HTML + Tailwind

When writing date input fields in modals or forms:

- ALWAYS use Mantine DatePickerInput, NOT <input type="date">
- Import: import { DatePickerInput } from '@mantine/dates'
- Wrap in MantineProvider if not already at layout level

### Sidebar Nav

- Sidebar nav group labels must be unique (duplicate labels cause React key collision warnings)
- Partner module: placed under a new "Partners" nav group
- Capital domain nav group: "Investments" (existing — do not rename)

---

## 12. Inertia Page Render Rule

- Controller: Inertia::render('Backend/Users/Index', [...])
- File: resources/js/Pages/Backend/Users/Index.tsx
- Capital B in `Backend`, capital first letter of each subfolder
- shadcn imports: `@/components/ui/...` (lowercase c)
- Custom shared components: `@/Components/shared/...` (uppercase C)

---

## 13. ActivityLogService

```php
ActivityLogService::log('module', 'action', 'description', $model, $properties)
// Pass $model object, not $model->id
```

---

## 14. Export Strategy

- CSV: native `response()->streamDownload()` — memory-safe, no package needed
- Excel: `maatwebsite/excel` with dedicated Export class
- PDF: `barryvdh/laravel-dompdf` with dedicated Blade template
- Export routes always declared BEFORE resource routes
- Shared filter logic extracted to private `buildExportQuery(Request)` method

---

## 15. Capital Ledger Rules

- Balance deducted ONLY on withdrawal approval — never on request creation
- Reinvestment entries are auto-created — never manually entered by admin
- Adjustment reason is mandatory — backend validation + frontend enforcement
- running_balance stored per entry — never recalculated on read (immutable ledger)
- Cannot withdraw more than current_balance — validated before creating request
- InvestorCapitalBalance seeded from existing investments (amount = initial deposit)
- Phase 1 → Phase 2 bridge: reinvest action must update BOTH InvestorProfitBalance AND InvestorCapitalBalance in same DB transaction
- CapitalLedgerEntry status field MUST be in $fillable (unlike ProfitDistribution status fields)

---

## 16. TypeScript Declaration File Rules

- `.d.ts` files: **type declarations only** — interfaces, type aliases, enums
- `.d.ts` files: **NEVER export runtime values** (const, let, var, functions)
- Runtime constants (color maps, label maps) → always in `.ts` files
- Vite cannot resolve runtime values from `.d.ts` at build time — causes import resolution failure
- Pattern: `foo.d.ts` for types + `foo-colors.ts` for runtime color/label maps

---

## 17. Partner Domain Rules (NEW)

- Partner is the central profit entity — never use investment amount to determine profit share
- Profit share percent is ALWAYS sourced from `partner_profit_rules.share_percent`
- Capital amount from `investments.amount` must NEVER appear in profit calculation queries
- A working partner or product partner may have zero investments — this is valid
- Rule resolution ALWAYS uses `effective_from <= period_start` date — never current date
- Pending rules (`approved_by IS NULL`) are invisible to all calculation engines
- Eligibility check must cover entire distribution period — partial coverage = ineligible
- Resume eligibility creates a NEW record — never mutates old paused record back to active
- One active eligibility record per partner enforced at service layer (create() throws RuntimeException)
- `effective_to` is set when a rule is superseded — never delete old rules
- Profit rule history is append-only — no updates, no deletes on `partner_profit_rule_history`
- Product assignment: check `effective_from <= sale_date AND (effective_to IS NULL OR effective_to >= sale_date)` per sale
- Settlement type is stored as snapshot in `profit_distribution_items.profit_rule_snapshot` — never recalculated from live config
- Partner soft delete: existing profit history, capital links, and distribution items are preserved
- Profit rule accessors (is_pending, is_approved, is_currently_active) must be explicitly
  appended via ->each(fn($rule) => $rule->append([...])) in controller —
  Laravel does not auto-include them in JSON serialization
- profit_rule.approve permission must be explicitly assigned to Admin role via seeder —
  Gate::before() bypass does NOT work for class-string based Gate::allows() checks
- Migration file names must exactly match Schema::create() table name —
  typo in filename causes FK constraint failure in history table
- PartnerProfitRule has no SoftDeletes — rules are versioned via effective_from/effective_to, never deleted
- Pending rules (approved_by IS NULL) are invisible to frontend calculation engine AND
  must be filtered in ProfitRulesPanel via is_pending accessor

---

## 18. Profit Calculation Engine Rules (NEW)

- Engine selection is based on `profit_distributions.source_type`:
    - `investment_based` → legacy CapitalBasedStrategy (backward compatible)
    - `partner_based` → dispatch to correct strategy per partner's rule_type
- Strategy classes live in `app/Services/ProfitCalculation/`
- Each strategy implements `ProfitCalculationStrategyInterface`
- Engine NEVER modifies any table — it returns a preview array only
- Snapshot is written by `ProfitDistributionController::store()` — not by the engine
- Mixed strategy: sum results from each applicable sub-strategy for that partner
- Product-based strategy: pre-aggregate sale totals per product per partner assignment — never row-by-row in PHP
