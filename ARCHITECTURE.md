# Architecture — Master POS System

> Architectural decisions and WHY they exist.
> Do not override these decisions without explicit discussion.

---

## 1. Framework & Stack Decisions

### Laravel 12 + React + Inertia.js

**Why:** Inertia.js eliminates the need for a separate REST API while keeping React as the frontend. Server-side routing and authorization stay in Laravel (familiar, battle-tested), while the frontend gets React's component model. No API versioning, no CORS configuration, no token management for the SPA.

### TypeScript

**Why:** The project involves complex financial data (decimal fields, payment states, distribution snapshots). TypeScript catches type errors at compile time — especially important when Laravel decimal fields serialize as strings in JSON and must be wrapped in Number().

### Tailwind CSS as Primary UI

**Why:** Utility-first approach produces consistent, maintainable UI without writing custom CSS. All spacing, colors, and layouts are standardized through Tailwind classes directly in components.

### Mantine UI v8 — Selective Use Only

**Why:** Mantine provides high-quality date pickers, rich text editors, carousels, and charts that would take significant effort to build from scratch. However, Mantine's component model conflicts with the project's native HTML approach for layouts and forms — so Mantine is used ONLY for:

- `@mantine/dates` → date pickers
- `@mantine/carousel` → image sliders
- `@mantine/tiptap` → rich text notes
- `@mantine/charts` → investor/capital analytics charts
- Everything else: native HTML + Tailwind

### Ziggy for Routing

**Why:** Generates named route helpers in JavaScript matching Laravel's route() function. Prevents hardcoded URLs in React components and ensures route changes in Laravel automatically reflect in the frontend.

---

## 2. Controller Architecture

### Inertia Controllers (standard)

- Return `Inertia::render()` for GET requests
- Return `redirect()->back()->with('success/error')` for mutations
- Always pass `can` array to Inertia props

### JSON Controllers (exceptions)

- `SaleController::store()` returns JSON — POS uses axios.post() not Inertia form submission
- `DashboardController::data()` returns JSON — frontend fetches with native fetch()
- `ProfitDistributionController::calculatePreview()` returns JSON — AJAX preview before form submit
- `ProfitPaymentController` returns JSON — payment actions triggered from Show page modals

### Why these exceptions exist

The POS terminal needs real-time checkout without full page navigation. The dashboard needs period-filtered data re-fetching without page reload. Payment modals need immediate feedback without Inertia redirects that would close the modal.

---

## 3. Permission Strategy

### Spatie + Gate::policy()

- All policies registered in AppServiceProvider via `Gate::policy()`
- Controllers use `abort_unless(Gate::allows())` or `optional(Auth::user())->can()`
- No middleware-based permission checks — all authorization in controller methods

### Why optional(Auth::user())->can() for ProfitDistribution

ProfitDistribution has complex authorization needs where the user context may vary. The `optional()` pattern prevents null pointer exceptions in edge cases (scheduled jobs, console commands).

### Why InvoiceController has no policy

Invoice is a view-only module reusing Sale data. Simple permission check (`hasPermissionTo('invoice.view')`) is sufficient — no model-level authorization needed.

---

## 4. Database Architecture

### Snapshot Accounting for Profit Distribution

**Why:** Financial records must be immutable after approval. If product prices, investment amounts, or expense records change after a distribution is created, the distribution should NOT be affected. Snapshots (frozen copies of investor_name, investment_title, invested_amount, share_percent, share_amount) are written once at store() time and never recalculated.

### Polymorphic Stock Movements

**Why:** Stock can change from multiple sources (purchases, sales, returns, adjustments). Polymorphic `reference_type` + `reference_id` allows a single table to track all movements with their source, enabling full audit trail without separate tables per source type.

### Weighted Average Cost

**Why:** More accurate than FIFO for high-volume retail. Average cost is updated on each purchase and stored on the product record for fast COGS calculation without scanning all historical purchases.

### Separate Payment Ledger (Step 17)

**Why:** The original `profit_distribution_items` had inline payment fields (single payment per item). Phase 1 introduced `profit_distribution_item_payments` as a separate table to support:

- Multiple partial payments per item
- Deferred and reinvested amounts (not just cash payment)
- Full payment history with audit trail
- Cancellation and reopening of individual transactions

### InvestorProfitBalance — Denormalized Running Balance

**Why:** Calculating pending balance from raw transaction data on every request requires expensive aggregation queries across multiple tables. A denormalized balance record with direct increment/decrement operations provides O(1) balance reads at the cost of more complex write operations (creditEarned, recordPayment, reverseEarned, etc.).

---

## 5. Frontend Architecture

### \_components/ Pattern

**Why:** Large pages split into `_components/` subfolder. Index.tsx imports all components and passes typed props. This keeps individual files small and focused, and allows shared types to be exported from Index.tsx for reuse across sibling components.

### Single Dashboard Endpoint

**Why:** Multiple separate API calls for dashboard data create race conditions, inconsistent loading states, and more complex frontend state management. One endpoint with period parameter returns all KPIs atomically.

### No shadcn/ui in Pages

**Why:** shadcn/ui generates component files that become part of the codebase and require maintenance. The project uses native HTML + Tailwind for all layouts, tables, buttons, and modals to maintain full control over styling without dependency on component library updates. shadcn/ui is only available for import from @/components/ui/ but not used in pages.

---

## 6. Export Architecture

### Three-Format Export Strategy

- **CSV:** Native PHP `response()->streamDownload()` — no package, memory-safe for large datasets
- **Excel:** `maatwebsite/excel` with dedicated Export class implementing FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
- **PDF:** `barryvdh/laravel-dompdf` with dedicated Blade template per report type

### Why separate Blade templates for PDF

DomPDF renders HTML to PDF. CSS Grid is NOT supported — only flexbox and HTML tables. Dedicated templates allow full control over PDF layout without affecting the web UI.

### Export Routes Before Resource Routes

**Why:** Laravel route matching is first-match. `/investments/export/{format}` must be declared before `Route::resource('investments')` otherwise `{investment}` wildcard swallows 'export' as an ID.

---

## 7. Security Architecture

### SecurityHeaders Middleware

Applied globally to all web routes. Sets:

- Content-Security-Policy (CSP) with explicit allowlists
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### ValidateSortColumn Middleware

**Why:** `orderBy()` with user-supplied column names is a SQL injection vector. This middleware maintains per-module allowlists of valid sort columns and strips invalid values before they reach Eloquent.

### DomPDF Logo Path

**Why:** DomPDF renders in a PHP context, not a browser context. `asset('storage/...')` returns a URL that DomPDF cannot resolve. `public_path('storage/...')` returns the server filesystem path that DomPDF can actually read.

### forceFill() for Status Fields

**Why:** `$fillable` excludes status/lock fields to prevent mass assignment attacks (e.g., a crafted request setting `is_locked=false` to bypass distribution locking). Model methods use `forceFill()->save()` to bypass the guard intentionally and explicitly.

---

## 8. Service Layer

### ActivityLogService

Central service for all audit logging. Accepts module, action, description, model, and properties array. All create/update/delete operations must call this.

### PurchaseStockService

Handles stock updates on purchase create/update/delete. Calculates weighted average cost.

### SaleStockService

Handles stock updates on sale create and reversal. `reverseStock()` called on sale delete.

### Why services instead of model methods

Business logic involving multiple models (stock update + activity log + notification) belongs in services, not Eloquent models. Models handle single-model concerns; services orchestrate cross-model workflows.

---

## 9. Hold Order Architecture

### Why Hard Delete Only

Hold Orders are ephemeral POS state — they exist between "hold cart" and "resume + complete sale". They have no business value after completion. Soft delete would create orphaned records that serve no purpose and add complexity to all Hold Order queries.

### Why AuthorizesRequests Trait

HoldOrderController uses Laravel's `AuthorizesRequests` trait and `$this->authorize('edit', $holdOrder)`. The policy method is named `edit()` not `update()`. Passing ability name 'edit' explicitly is required because `authorize('update')` would map to `update()` which doesn't exist in the policy, causing silent 403.

---

## 10. Known Constraints & Limitations

### DomPDF

- No CSS Grid support — flexbox/tables only in PDF Blade templates
- Cannot load images from URLs — must use server filesystem paths (public_path)
- DejaVu Sans recommended for Unicode support in PDFs

### Inertia + Async

- Inertia router callbacks (onSuccess/onError/onFinish) incompatible with async/await in some React versions
- Always use .then() pattern for confirmAction() handlers

### Eager Loading + withTrashed

- `with('relation:id,name')` column select syntax does NOT support withTrashed()
- Solution: paginate first, then call `getCollection()->load(['relation' => fn($q) => $q->withTrashed()])`

### CSP + IPv6

- IPv6 addresses (`[::1]`) are NOT valid CSP source values
- Vite must be configured with `host: 'localhost'` to prevent binding to `[::1]`

### Laravel ConvertEmptyStringsToNull

- Empty string query params are converted to null by middleware
- Use `$request->filled()` instead of `$request->input()` with default value for filter logic
