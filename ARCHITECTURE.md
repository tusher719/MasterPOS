# Architecture — Master Business Suite

> Architectural decisions and WHY they exist.
> Do not override these decisions without explicit discussion.

---

## 1. Framework & Stack Decisions

### Laravel 12 + React + Inertia.js

**Why:** Inertia.js eliminates the need for a separate REST API while keeping React as the frontend. Server-side routing and authorization stay in Laravel (familiar, battle-tested), while the frontend gets React's component model. No API versioning, no CORS configuration, no token management for the SPA.

### TypeScript

**Why:** The project involves complex financial data (decimal fields, payment states, distribution snapshots, profit rule versioning). TypeScript catches type errors at compile time — especially important when Laravel decimal fields serialize as strings in JSON and must be wrapped in Number().

### Tailwind CSS as Primary UI

**Why:** Utility-first approach produces consistent, maintainable UI without writing custom CSS. All spacing, colors, and layouts are standardized through Tailwind classes directly in components.

### Mantine UI v8 — Selective Use Only

**Why:** Mantine provides high-quality date pickers, rich text editors, carousels, and charts that would take significant effort to build from scratch. However, Mantine's component model conflicts with the project's native HTML approach for layouts and forms — so Mantine is used ONLY for:

- `@mantine/dates` → date pickers (including effective_from/effective_to in profit rule forms)
- `@mantine/carousel` → image sliders
- `@mantine/tiptap` → rich text notes
- `@mantine/charts` → investor/capital/partner analytics charts
- Everything else: native HTML + Tailwind

### Ziggy for Routing

**Why:** Generates named route helpers in JavaScript matching Laravel's route() function. Prevents hardcoded URLs in React components and ensures route changes in Laravel automatically reflect in the frontend.

---

## 2. Financial Domain Architecture — Core Decision

### Two Independent Domains: Capital and Profit

**Why:** The original design coupled investment amount directly to profit share. This caused fundamental business modeling failures — a working partner with zero capital investment could not receive profit, and two investors with different capital amounts could not have the same profit share by negotiation.

The redesign separates:

- **Capital Domain** (Investment entity) — tracks money flow into and out of the business
- **Profit Domain** (Partner entity) — tracks profit entitlement, rules, and settlement

These domains are linked via `partner_investments` but operate independently.

### Why Investment Remains the Capital Entity (Not Replaced by Partner)

The Capital Ledger (Phase 2) is already built around `investments`. Replacing Investment as the capital entity would require rewriting:

- Capital Ledger entries and queries
- Capital withdrawal workflow
- Investor statements
- InvestorCapitalBalance and InvestorProfitBalance tables

By keeping Investment as the capital entity and introducing Partner as the profit entity, backward compatibility is preserved at zero cost. The `partner_id` column is added as nullable to existing tables — old records remain untouched.

### Why Partner is the Profit Entity (Not Investment)

Because profit entitlement is a business agreement, not a mathematical consequence of capital contributed. Two people might agree that one gets 35% profit and one gets 65% regardless of their relative capital contributions. The system must be able to express this.

### Per-Stream Settlement and Eligibility (Gap 2.3)

**Why `applies_to` instead of separate tables:**
A Mixed Partner's different income streams (capital / working / product) need
independent settlement configs and eligibility records. Adding `applies_to` to
the existing two tables costs one migration each and keeps all queries simple —
no new join, no new model. The alternative (separate tables per stream) would
have tripled the schema complexity for a Nice to Have feature.

**Option A resolution in SettlementCalculationService:**
When a partner has both a stream-specific config (e.g. `applies_to = 'product'`)
and a general config (`applies_to = 'all'`), the specific one wins. This allows
a Mixed Partner to override the general config for one stream without deleting
the general config entirely.

**Frontend: selector hidden for single-type partners:**
`availableAppliesToOptions` useMemo filters by partner type flags — a pure
Capital partner only sees `'all'` and `'capital'`, so the selector is hidden
(one option = no choice needed). This keeps the UI simple for the common case.

### Legacy "Investor" Naming — Why It Was Not Renamed (Gap 3)

When the Partner domain was introduced in Phase 4, the ideal solution would
have been to rename all `Investor*` classes and tables to `Partner*`. This was
not done for three reasons:

**Reason 1 — Volume of change**
`InvestorProfitBalance` and `InvestorCapitalBalance` are referenced in 10+
files across controllers, services, and models. A rename without a full test
suite risks silent breakage across the capital ledger, withdrawal workflow,
profit distribution, and investor statement modules.

**Reason 2 — Naming conflict**
Gap 4.2 introduced `PartnerProfitBalance` (model) and `partner_profit_balances`
(table) for a different purpose — tracking working/product partner balances
that have no linked investment. Renaming `InvestorProfitBalance` to
`PartnerProfitBalance` would create a direct collision between two models
serving different use cases.

**Reason 3 — Backward compatibility**
All existing `investment_based` distributions reference `investor_profit_balances`
via `investment_id`. Renaming the table requires a migration, a data backfill,
and updates to every query that joins or references this table. The risk
outweighs the cosmetic benefit at this stage.

**What was done instead (Gap 3 resolution):**

- `payee_name` accessor added to `ProfitDistributionItem` — new code reads
  `->payee_name` instead of `->investor_name` directly
- PROJECT_RULES.md Rule 20 documents the legacy names and prohibits new
  `Investor*` names in any future code
- Deferred renames logged formally in GAPS_AND_RECOMMENDATIONS.md for
  post-testing execution

**The two-balance-model pattern:**

investment_based partner partner_based partner (no investment)
↓ ↓
InvestorProfitBalance PartnerProfitBalance
investor_profit_balances partner_profit_balances
(has investment_id, partner_id) (has partner_id only)

Both models coexist permanently. A partner with a linked investment uses
`InvestorProfitBalance` for its profit history. A working or product partner
with no investment uses `PartnerProfitBalance`. These are NOT duplicates —
they serve different use cases and must never be merged without careful
data migration planning.

---

## 3. Controller Architecture

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

## 4. Permission Strategy

### Spatie + Gate::policy()

- All policies registered in AppServiceProvider via `Gate::policy()`
- Controllers use `abort_unless(Gate::allows())` or `optional(Auth::user())->can()`
- No middleware-based permission checks — all authorization in controller methods

### Why optional(Auth::user())->can() for ProfitDistribution

ProfitDistribution has complex authorization needs where the user context may vary. The `optional()` pattern prevents null pointer exceptions in edge cases (scheduled jobs, console commands).

### Why InvoiceController has no policy

Invoice is a view-only module reusing Sale data. Simple permission check (`hasPermissionTo('invoice.view')`) is sufficient — no model-level authorization needed.

### Partner Module Policies

PartnerPolicy and PartnerProfitRulePolicy are registered via `Gate::policy()` in AppServiceProvider. The `PartnerProfitRulePolicy` has a dedicated `approve()` method — separate from `edit()` — because approving a financial rule requires a higher permission than editing a draft.

---

## 5. Database Architecture

### Snapshot Accounting for Profit Distribution

**Why:** Financial records must be immutable after approval. If product prices, investment amounts, partner profit percentages, or product assignments change after a distribution is created, the distribution should NOT be affected. Snapshots (frozen copies of investor_name, share_percent, share_amount, profit_rule_snapshot) are written once at store() time and never recalculated.

### Why profit_rule_snapshot is JSON (Not Normalized)

The `profit_rule_snapshot` column stores a JSON copy of the exact `partner_profit_rules` record used at calculation time. Normalizing this into FK relationships would break snapshot integrity — if the rule record changes (versioning), the historical distribution would resolve the wrong rule. JSON snapshot is immutable by design.

### Polymorphic Stock Movements

**Why:** Stock can change from multiple sources (purchases, sales, returns, adjustments). Polymorphic `reference_type` + `reference_id` allows a single table to track all movements with their source, enabling full audit trail without separate tables per source type.

### Polymorphic Product Assignments

**Why:** `partner_product_assignments.assignable_type` + `assignable_id` follows the same pattern. Currently only `product` is supported, but the schema already accommodates `category`, `brand`, `warehouse` without any migration. This is deliberate future-proofing.

### Weighted Average Cost

**Why:** More accurate than FIFO for high-volume retail. Average cost is updated on each purchase and stored on the product record for fast COGS calculation without scanning all historical purchases.

### Separate Payment Ledger (Step 17 Phase 1)

**Why:** The original `profit_distribution_items` had inline payment fields (single payment per item). Phase 1 introduced `profit_distribution_item_payments` as a separate table to support multiple partial payments, deferred and reinvested amounts, and full payment history with cancellation/reopening.

### InvestorProfitBalance — Denormalized Running Balance

**Why:** Calculating pending balance from raw transaction data on every request requires expensive aggregation queries across multiple tables. A denormalized balance record with direct increment/decrement operations provides O(1) balance reads at the cost of more complex write operations.

### Backward Compatibility via Nullable Foreign Keys

All new `partner_id` columns on existing tables are nullable. Old records (investments, profit_distribution_items, capital_ledger_entries, investor_profit_balances, investor_capital_balances) remain valid with `partner_id = null`. New records created under the partner domain populate `partner_id`. This allows gradual migration without data loss.

### profit_distributions.source_type

**Why:** Allows both legacy (investment_based) and new (partner_based) distributions to coexist permanently. Old distributions are never reprocessed. New distributions use the strategy engine. This eliminates the risk of breaking existing financial records during the architecture transition.

---

## 6. Profit Calculation Engine Architecture

### Strategy Pattern

**Why:** Different partner types require completely different profit calculations. A fixed percentage partner, a product-based partner, and a legacy investment-based partner cannot share the same calculation code. The Strategy Pattern isolates each calculation method behind a common interface, allowing:

- New strategies to be added without modifying existing ones
- Strategies to be composed (MixedStrategy)
- The engine to dispatch the correct strategy at runtime based on partner rule_type

### Engine is Read-Only

**Why:** The engine produces a preview array. It never writes to the database. This enforces a clean separation between calculation (engine) and persistence (controller). The preview can be shown to the admin before confirmation, and the snapshot is written only on explicit `store()`.

### Rule Resolution at period_start

**Why:** Using `period_start` as the anchor date for rule resolution ensures historical correctness. If a partner's rule changed mid-year, distributions before the change use the old rule and distributions after the change use the new rule — automatically, without any manual intervention.

---

## 7. Profit Rule Versioning Architecture

### Why Effective Dating Instead of Overwriting

Overwriting `share_percent` on the existing rule would silently invalidate historical distributions. With effective dating:

- Old rule: `effective_to = 2026-03-31`
- New rule: `effective_from = 2026-04-01`

Both rules exist permanently. Rule resolution always finds the correct version for any historical date. This is the only financially safe approach.

### Why partner_profit_rule_history is Append-Only

**Why:** The audit table must be a complete and immutable record of every change. If records could be updated or deleted, the audit trail would be compromised. Append-only guarantees that what happened cannot be hidden.

### Approval Workflow Before Active

**Why:** A rule configured but not yet approved should never affect a live calculation. The `approved_by IS NULL` check acts as a gate — unapproved rules are invisible to the engine. This prevents accidental application of a rule that hasn't been reviewed.

---

## 8. Frontend Architecture

### \_components/ Pattern

**Why:** Large pages split into `_components/` subfolder. Index.tsx imports all components and passes typed props. This keeps individual files small and focused, and allows shared types to be exported from Index.tsx for reuse across sibling components.

### Partner Page Structure

Partner Show page uses the `lg:grid-cols-3` layout (main content + sidebar) consistent with other detail pages. Complex panels (ProfitRulesPanel, ProductAssignmentsPanel) are extracted into `_components/` to keep Show.tsx readable.

### Single Dashboard Endpoint

**Why:** Multiple separate API calls for dashboard data create race conditions, inconsistent loading states, and more complex frontend state management. One endpoint with period parameter returns all KPIs atomically.

### No shadcn/ui in Pages

**Why:** shadcn/ui generates component files that become part of the codebase and require maintenance. The project uses native HTML + Tailwind for all layouts, tables, buttons, and modals to maintain full control over styling without dependency on component library updates.

### Date Input Components

Two reusable Mantine-based date components exist at `resources/js/Components/DatePicker/`:

- `AppDateInput` — single date picker with Friday highlight and today indicator
- `AppDateRangeInput` — range picker with BD calendar settings, hover range preview,
  and a preset sidebar (week/month/quarter/year shortcuts)

Both use Mantine `Calendar` under the hood with BD-specific settings
(`firstDayOfWeek=6`, `weekendDays=[5]`). They are the ONLY date inputs
used in the project — no raw `<input type="date">` allowed anywhere.

New date input types (month picker, time picker, etc.) should be added
to this component folder and exported from the index, not built inline in pages.

---

## 9. Export Architecture

### Three-Format Export Strategy

- **CSV:** Native PHP `response()->streamDownload()` — no package, memory-safe for large datasets
- **Excel:** `maatwebsite/excel` with dedicated Export class implementing FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
- **PDF:** `barryvdh/laravel-dompdf` with dedicated Blade template per report type

### Why separate Blade templates for PDF

DomPDF renders HTML to PDF. CSS Grid is NOT supported — only flexbox and HTML tables. Dedicated templates allow full control over PDF layout without affecting the web UI.

### Export Routes Before Resource Routes

**Why:** Laravel route matching is first-match. `/investments/export/{format}` must be declared before `Route::resource('investments')` otherwise `{investment}` wildcard swallows 'export' as an ID.

---

## 10. Security Architecture

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

### forceFill() for Approval Fields

Same pattern applied to `partner_profit_rules.approved_by/approved_at` and `partner_product_assignments.approved_by/approved_at`. These fields must only be set through explicit approval controller actions, never through bulk form submissions.

---

## 11. Service Layer

### ActivityLogService

Central service for all audit logging. Accepts module, action, description, model, and properties array. All create/update/delete operations must call this.

### PurchaseStockService

Handles stock updates on purchase create/update/delete. Calculates weighted average cost.

### SaleStockService

Handles stock updates on sale create and reversal. `reverseStock()` called on sale delete.

### ProfitCalculationEngine (New — Phase 4F)

Dispatches to the correct calculation strategy based on `profit_distributions.source_type` and partner's `rule_type`. Returns preview array only — never writes to database.

Located in `app/Services/ProfitCalculation/`:

- `ProfitCalculationEngine.php` — dispatcher
- `ProfitCalculationStrategyInterface.php` — contract
- `FixedPercentStrategy.php`
- `ProductBasedStrategy.php`
- `CapitalBasedStrategy.php` (legacy)
- `MixedStrategy.php`

### PartnerEligibilityService (New — Phase 4C)

Resolves whether a partner is eligible for a given distribution period. Encapsulates the eligibility query logic so it is not duplicated across controllers.

- `isEligible(Partner, period_start, period_end)` — single authoritative check; Phase 4F calls this directly
- `isEligibleBatch(partnerIds[], period_start, period_end)` — returns partner_id => bool map; avoids N+1 on multi-partner distributions
- `create()` — enforces one-active-at-a-time rule; throws RuntimeException if active record exists
- `pause()` — sets status=paused, stores pause_reason + paused_by/at
- `resume()` — creates a NEW active record from resume_date; marks old record with resumed_by/at (status stays paused)
- `end()` — sets status=ended, profit_end_date=today

### PartnerRuleResolutionService (New — Phase 4B)

Given a `partner_id` and a `period_start` date, returns the correct `partner_profit_rules` record. Encapsulates the `effective_from <= date` versioning query.

### SettlementCalculationService (New — Phase 4D)

Calculates settlement amounts per partner based on their `partner_settlement_configs`. Returns cost_return + profit_share breakdown for product partners.

### Why services instead of model methods

Business logic involving multiple models (stock update + activity log + notification) belongs in services, not Eloquent models. Models handle single-model concerns; services orchestrate cross-model workflows.

### StockReservationService (New — Item 3.5)

Manages stock reservation lifecycle for storefront orders.

- `reserve()` — locks product/variant row, checks available qty minus active reservations, creates reservation with configurable window (stock_reservation_minutes setting)
- `convertToSale()` — marks reservation as converted after payment verified; actual stock deduction handled by SaleStockService::applyStock()
- `release()` — manually releases a reservation (customer cancelled before payment)
- `sweepExpired()` — bulk-expires active reservations past reserved_until window; processes in chunks of 100 with per-row lockForUpdate() guard

---

## 12. Hold Order Architecture

### Why Hard Delete Only

Hold Orders are ephemeral POS state — they exist between "hold cart" and "resume + complete sale". They have no business value after completion. Soft delete would create orphaned records that serve no purpose and add complexity to all Hold Order queries.

### Why AuthorizesRequests Trait

HoldOrderController uses Laravel's `AuthorizesRequests` trait and `$this->authorize('edit', $holdOrder)`. The policy method is named `edit()` not `update()`. Passing ability name 'edit' explicitly is required because `authorize('update')` would map to `update()` which doesn't exist in the policy, causing silent 403.

---

## 13. Domain Events (Deferred)

Laravel's built-in event system is sufficient. No event sourcing infrastructure is needed at this scale.

Events are registered in `EventServiceProvider` as modules grow. Current candidates (fire but no listeners yet):

```
PartnerCreated
ProfitRuleChanged
ProfitRuleApproved
PartnerEligibilityPaused
PartnerEligibilityResumed
ProductAssignmentChanged
DistributionApproved
SettlementCompleted
```

This keeps the system loosely coupled without over-engineering the current phase.

---

## 14. Known Constraints & Limitations

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

### Profit Rule Approval Timing

- A rule created in January but only approved in March should use `effective_from` (January) not `approved_at` (March) for resolution
- `approved_at` is for audit purposes only — never used in calculation queries

### Product-Based Calculation Performance

- Aggregating sale totals per product per partner assignment can be expensive on large datasets
- Always pre-aggregate with GROUP BY in SQL — never iterate sale rows in PHP
- Future: consider a pre-calculated period summary table if performance degrades

## Theme Architecture

### CSS Variable System

- All colors stored as RGB triplets: `--background: 255 255 255`
- Tailwind reads: `rgb(var(--background) / <alpha-value>)`
- Dark mode: .dark class on <html> overrides variables
- ThemeProvider injects user-specific overrides via element.style

### Variable Namespacing

- --background/--foreground/--card/--primary/--border → Tailwind colors
- --radius → Tailwind rounded-lg/md/sm
- --theme-sidebar-\* → Custom sidebar (hex format)
- --font-sans → Body font family
- --font-size-base → Body font size
- --density-padding/--density-row-height → Spacing (1.20)

### Component Hierarchy

App
└── MantineProvider (defaultColorScheme:'auto')
└── ThemeProvider (reads userPreferences, injects CSS vars)
└── AuthenticatedLayout
├── Sidebar (--theme-sidebar-\* vars)
├── Navbar (bg-card border-border)
└── Main (bg-background)

### Font Loading

- Inter Variable: @fontsource-variable/inter (bundled)
- Others: Google Fonts CDN, dynamically injected <link> tags
- loadGoogleFont() checks document.getElementById() before inject

## 15. System Status Architecture (Item 1.16)

### Middleware-Based Status Control

Two middleware classes handle system status:

- `CheckMaintenanceMode` — applied to backend route group; reads `maintenance_mode_enabled` from SettingsService cache; Super Admin role bypasses via `hasRole('Admin')` check
- `CheckComingSoon` — registered and aliased but not yet applied to any route group; will be applied to storefront routes in Sprint 8

Both middleware use `SettingsService::all()` (cache-backed) — no DB query on every request.

### Why Middleware Instead of Global Middleware

Global middleware (applied to all requests) would affect JSON/API routes and could interfere with auth flows. Route-group-level middleware allows surgical application:

- Maintenance: backend group only → staff locked out, admin passes through
- Coming Soon: storefront group only → backend/POS completely unaffected

### Surface Detection Pattern

The same `$resolveSurface()` helper (introduced in Item 1.14 for 404 pages) is reused for 500 error pages. Pattern: URL prefix matching, `/backend/pos` checked before `/backend`.

### Offline Detection

Client-side only — `navigator.onLine` API + window events. No server involvement. `OfflineOverlay` mounted at `AuthenticatedLayout` level so it covers all backend/POS pages without being added to individual pages.

### Settings Storage

Status flags stored as string `'true'`/`'false'` in `business_settings` (consistent with existing boolean settings like `tax_enabled`, `notify_on_sale`). SettingsService cache is invalidated automatically via `BusinessSettingObserver` on every save — no manual cache:clear needed after toggle.
