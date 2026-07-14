# Changelog — Master POS System

---

## [v2.6 — Step 17 Phase 4C] — Profit Eligibility — 2026-07-14

### New Table

- `partner_profit_eligibilities`: partner_id, profit_start_date, profit_end_date (null=ongoing),
  status (active/paused/ended), pause_reason, paused_by/at, resumed_by/at, created_by

### New Model

- `PartnerProfitEligibility`: scopeActive/Paused/Ended/CoveringPeriod,
  is_active/is_paused/is_ended/is_ongoing accessors, all user relations with withTrashed()

### New Service

- `PartnerEligibilityService`: isEligible(), isEligibleBatch(), getActiveRecord(),
  hasActiveEligibility(), create(), pause(), resume(), end()
  — isEligible() is the authoritative method for Phase 4F engine

### New Policy

- `PartnerEligibilityPolicy`: viewAny/create/pause/resume/end
  — no model parameter on any method (ArgumentCountError prevention)
  — end() reuses eligibility.pause permission

### New Controller

- `PartnerEligibilityController`: store, pause, resume, end
  — abort_unless($eligibility->partner_id === $partner->id, 404) cross-partner guard

### New Seeder

- `Step17Phase4CPermissionSeeder`: eligibility.view/create/pause/resume
  Admin all, Staff view only

### Updated Files

- `Partner` model: eligibilities() HasMany relation added
- `PartnerController::show()`: eligibilities eager load + eligibilityCan array added
- `AppServiceProvider`: PartnerEligibilityPolicy registered
- Routes: eligibilities.store/pause/resume/end nested inside partners group
- `partner.d.ts`: EligibilityStatus, PartnerEligibility, EligibilityFormData,
  PauseEligibilityFormData, ResumeEligibilityFormData, EligibilityCan added;
  PartnerShowProps updated with eligibilities + eligibilityCan
- `partner-colors.ts`: ELIGIBILITY_STATUS_COLORS/LABELS added

### New Frontend Components

- `CreateEligibilityModal.tsx`: profit_start_date, profit_end_date (optional)
- `PauseEligibilityModal.tsx`: pause_reason mandatory (min 5 chars), amber warning box
- `ResumeEligibilityModal.tsx`: resume_date (defaults today), new end date optional,
  info box explains new record creation
- `EligibilityPanel.tsx`: active record card, paused banner with resume button,
  history list with full audit trail

### Bug Fixed

- Route name in frontend must include `backend.` prefix:
  `backend.partners.eligibilities.store` not `partners.eligibilities.store`

### Known Rules Established

- Nested route names always include outer group prefix — verify with
  `php artisan route:list --name=` before using in frontend components
- Resume creates a NEW eligibility record — never mutates old paused record back to active
- One active eligibility record per partner enforced at service layer (create() throws RuntimeException)
- PartnerEligibilityService::isEligible() is the single authoritative eligibility check —
  Phase 4F engine calls this directly, no duplicate query logic elsewhere

---

## [v2.5 — Step 17 Phase 4B] — Profit Rules + Versioning — 2026-07-14

### New Tables

- `partner_profit_rules`: rule_type, profit_source, share_percent (decimal 8,4),
  effective_from, effective_to (null = active), approved_by/approved_at (excluded from $fillable)
- `partner_profit_rule_history`: append-only audit table, change_type enum,
  previous_value/new_value JSON

### New Models

- `PartnerProfitRule`: scopeApproved/Pending/ActiveAt, getIsPendingAttribute,
  getIsApprovedAttribute, getIsCurrentlyActiveAttribute, approve() + recordCreatedHistory()
    - recordUpdatedHistory() business logic methods
- `PartnerProfitRuleHistory`: append-only, no SoftDeletes

### New Policy

- `PartnerProfitRulePolicy`: viewAny/create/edit/approve — approve() separate from edit()
  No model parameter on any method (ArgumentCountError prevention)

### New Controller

- `PartnerProfitRuleController`: store/update/approve/destroy
  update() blocks approved rules, destroy() blocks approved rules

### New Service

- `PartnerRuleResolutionService`: resolve() single partner, resolveForPartners() batch,
  hasActiveRule() validation helper, getRuleHistory() display helper

### New Seeder

- `Step17Phase4BPermissionSeeder`: profit_rule.view/create/edit/approve —
  Admin gets all 4, Staff gets view only

### Updated Files

- `Partner` model: profitRules() HasMany relation added, PartnerProfitRule import added
- `PartnerController::show()`: profitRules eager load with append accessors, profitRuleCan array
- `partner.d.ts`: RuleType, ProfitSource, RuleChangeType types, PartnerProfitRule,
  PartnerProfitRuleHistory, ProfitRuleFormData, ProfitRuleCan interfaces added
- `partner-colors.ts`: RULE_TYPE_COLORS/LABELS, PROFIT_SOURCE_COLORS/LABELS,
  RULE_CHANGE_TYPE_COLORS/LABELS added
- Routes: profit-rules nested inside partners prefix group

### New Frontend Components

- `ProfitRulesPanel.tsx`: ActiveRuleCard, PendingRuleCard, HistoricalRuleCard sub-components,
  approve/delete SweetAlert2 confirms
- `CreateProfitRuleModal.tsx`: rule_type, profit_source, share_percent, effective_from, reason
- `EditProfitRuleModal.tsx`: pending rules only, useEffect populate, date slice [0,10]
- `RuleHistoryDrawer.tsx`: z-[60], timeline UI, all rules history merged + sorted

### Bug Fixes

- Migration typo: `partner_profi_rules` → `partner_profit_rules` (filename + Schema::create)
- FK constraint failure: history table migration failed due to parent table name typo
- Accessor not serialized: added ->each(fn($rule) => $rule->append([...])) in controller
- profit_rule.approve not working: Gate::before() bypass fails for class-string checks —
  permission must be explicitly assigned to role via seeder

### Known Rules Established

- Accessors must be appended explicitly — never rely on auto-serialization
- Gate::before() bypass unreliable for class-string Gate::allows() — always assign explicitly
- Migration filename must match Schema::create() table name exactly

---

## [v2.4 — Step 17 Phase 4A] — Partner Domain Foundation — 2026-07-14

### New Tables

- `partners`: name, code (PTR-001 auto-generated), partner_type_capital/working/product (boolean flags), phone, email, address, user_id (optional system user link), note, is_active, created_by, updated_by, soft deletes
- `partner_investments`: partner_id, investment_id, is_primary, note — UNIQUE(partner_id, investment_id), hard delete only

### New Models

- `Partner`: SoftDeletes, generateCode() PTR-001 format with withTrashed() scan, BelongsToMany investments via partner_investments, getTypeLabelsAttribute, getHasTypeAttribute
- `PartnerInvestment`: no SoftDeletes, withTrashed() on both relations

### New Policy

- `PartnerPolicy`: viewAny/view/create/update/delete/restore/forceDelete — forceDelete requires Super Admin role explicitly

### New Controller

- `PartnerController`: index (paginated + search/type/status/trashed filters + stats), show (eager loads investments with pivot id), store (generateCode auto), update, destroy (soft), restore (onlyTrashed), forceDelete (cascades partnerInvestments first), bulkAction (delete/restore/force_delete), linkInvestment (duplicate check + is_primary cascade), unlinkInvestment

### New Seeder

- `Step17Phase4APermissionSeeder`: partners.view/create/edit/delete/restore — Admin all, Staff view only

### New Routes

- bulk-action, restore, force-delete declared BEFORE resource routes
- link-investment (POST), unlink-investment (DELETE) routes added

### New Frontend

- `Backend/Partners/Index.tsx`: stats cards, filters (search/type/status/trashed), bulk actions bar, table with type badges, pagination
- `Backend/Partners/Show.tsx`: lg:grid-cols-3 layout, partner info, linked investments, status/types/audit sidebar
- `_components/CreatePartnerModal.tsx`: name, 3 type checkboxes, phone, email, address, note, status
- `_components/EditPartnerModal.tsx`: useEffect populates from partner prop, code shown in header
- `_components/LinkedInvestmentsCard.tsx`: pivot id fix (withPivot('id')), amount Number() wrap, footer totals, unlink confirm
- `_components/LinkInvestmentModal.tsx`: unlinked investments only, is_primary cascade warning, preview card

### New Types

- `partner.d.ts`: Partner, PartnerInvestment, PartnerLinkedInvestment (pivot.id included), InvestmentOption, PartnerFilters, PartnerStats, PartnerCan, PartnerPaginatedData, PartnerIndexProps, PartnerShowProps, PartnerFormData, LinkInvestmentFormData
- `partner-colors.ts`: PARTNER_TYPE_COLORS, PARTNER_TYPE_LABELS, PARTNER_STATUS_COLORS, INVESTMENT_STATUS_COLORS, getPartnerTypes() helper

### Sidebar

- New "Partners" nav group added after Investments, before Reports

### Bug Fixes

- Unlink 404: withPivot('id') added to show() eager load — pivot row id now available as investment.pivot.id
- CSP [::1] warning: vite.config.js host: 'localhost' set

### Architecture Notes

- Partner is the central PROFIT entity — capital entity remains Investment (unchanged)
- forceDelete cascade: partnerInvestments deleted first — Phase 4B+ tables to be added to cascade sequence
- Super Admin bypass via Gate::before() in AppServiceProvider — forceDelete additionally checked explicitly in policy

---

## [v2.3 — Architecture] — Financial Architecture Redesign — 2026-07-13

### Financial Domain Redesign (Documentation Only — No Code Yet)

- Separated financial system into two independent domains: Capital (Investment entity) and Profit (Partner entity)
- Capital amount from investments.amount is permanently decoupled from profit share calculation
- Partner introduced as the central profit entity replacing investment-based profit sharing
- Partner types: capital, working, product (non-exclusive boolean flags, combinable)
- Profit Rules: manually configured share_percent per partner, independent of capital amount
- Profit Rule Versioning: effective_from + effective_to date-based versioning, old rules never deleted
- Profit Rule Approval Workflow: pending rules (approved_by IS NULL) invisible to calculation engine
- Profit Eligibility: completely independent of capital status — configurable start/end/pause/resume
- Product Partner support: cost_return + profit_share settlement model
- Product Assignments: polymorphic assignable_type/id — individual products now, categories/brands future
- Settlement Engine: profit_only / cost_plus_profit / custom strategies per partner type
- Profit Calculation Engine: Strategy Pattern — FixedPercentStrategy, ProductBasedStrategy, CapitalBasedStrategy (legacy), MixedStrategy
- profit_distributions.source_type: investment_based (legacy) / partner_based (new) coexist permanently
- Historical backward compatibility: all new columns nullable on existing tables, no existing data modified
- investment_fund_usages: redesigned to be partner-aware (capital_ledger_entry → purchase/expense link)
- partner_profit_rule_history: append-only audit table for all rule changes

### New Tables Designed (not yet migrated)

```
partners
partner_investments
partner_profit_rules
partner_profit_rule_history
partner_profit_eligibilities
partner_product_assignments
partner_settlement_configs
investment_fund_usages
```

### Existing Tables — New Columns Designed (not yet migrated)

```
investments.partner_id (FK partners nullable)
profit_distributions.source_type (enum: investment_based/partner_based)
profit_distribution_items.partner_id (FK partners nullable)
profit_distribution_items.profit_rule_id (FK partner_profit_rules nullable)
profit_distribution_items.profit_rule_snapshot (json nullable)
profit_distribution_items.settlement_type (enum nullable)
investor_profit_balances.partner_id (FK partners nullable)
capital_ledger_entries.partner_id (FK partners nullable)
investor_capital_balances.partner_id (FK partners nullable)
```

### Documentation Updated

- MASTER_CONTEXT.md: new domain overview, pending module list restructured into Phase 4A–4H
- PROJECT_RULES.md: Partner Domain Rules (Rule 17) + Profit Calculation Engine Rules (Rule 18) added
- DATABASE_SCHEMA.md: all new tables documented, existing table modifications noted
- BUSINESS_RULES.md: complete rewrite of profit rules, partner rules, eligibility, settlement, calculation engine
- ARCHITECTURE.md: financial domain architecture section added, strategy pattern documented
- CHANGELOG.md: this entry

---

## [v2.2] — Step 17 Phase 3 — 2026-07-13

### Investor Statements

- InvestorStatementController: index (all investors summary), show (full statement), pdf (dompdf export)
- Read-only module — no mutations, no separate Policy (Gate::allows() directly)
- show() uses eager loading for all 4 relations to avoid N+1
- Index page: all investors with capital + profit summary, footer totals
- Show page: Investment Info, CapitalSummaryCard, ProfitSummaryCard, DistributionHistoryTable, CapitalTransactionTable
- CapitalSummaryCard: hero balance + breakdown rows + net check footer
- ProfitSummaryCard: pending balance hero + settlement progress bar
- DistributionHistoryTable: distribution status + payment status columns, empty state, footer totals
- CapitalTransactionTable: credit/debit split columns, Balance After (running_balance), cancelled rows dimmed
- PDF: A4 portrait, 4 sections, DejaVu Sans, flexbox+tables (no CSS Grid), fixed footer with page number
- investor-statement.d.ts: all TypeScript interfaces for statement data
- investor-statement-colors.ts: runtime color maps (separate from .d.ts — .d.ts cannot hold runtime values)
- Step17Phase3PermissionSeeder: investor_statement.view + export (Admin only)
- Sidebar: Investor Statements link under Investments group

### Bug Fixes

- ProfitDistributionItem: profitDistribution() BelongsTo relation was missing — added (duplicate of distribution() with explicit name for eager loading in InvestorStatementController)
- investor-statement.d.ts: PAYMENT_STATUS_COLORS / CAPITAL_TX_COLORS / CAPITAL_TX_DIRECTION_COLORS moved to investor-statement-colors.ts — .d.ts files cannot export runtime const values, Vite cannot resolve them

### Known Architectural Notes

- investor-statement-colors.ts rule: color map constants must live in .ts not .d.ts
- WithTrashed not needed on Investment in index() — withTrashed() already applied before load

---

## [v2.1] — Step 17 Phase 2 — 2026-07-12

### Capital Ledger

- capital_ledger_entries table: deposit/withdrawal/reinvestment/adjustment entries with running balance
- investor_capital_balances table: denormalized balance per investor (1:1 with investments)
- InvestorCapitalBalanceSeeder: seeds initial deposit from existing investments.amount
- CapitalLedgerController: index (all investors summary), show (per-investor ledger), store (deposit/adjustment/withdrawal request)
- CapitalWithdrawalController: approve (balance deducted only here), reject, cancel
- CapitalLedgerPolicy: view/deposit/adjust/withdrawal.request/withdrawal.approve
- Step17Phase2PermissionSeeder: Admin all, Staff view only
- Phase 1 → Phase 2 bridge: ProfitPaymentController reinvest action now credits InvestorCapitalBalance + creates CapitalLedgerEntry in same DB transaction
- Frontend: CapitalLedger/Index.tsx (summary table), Show.tsx (ledger + pending withdrawals), DepositModal, WithdrawalModal, AdjustmentModal, WithdrawalApprovalModal, LedgerTable
- Sidebar: Capital Ledger nav link under Investments group

### Bug Fixes

- ProfitDistribution.getPaidItemsCountAttribute: now counts deferred/reinvested/cancelled as settled
- ProfitDistribution.getTotalPaidAmountAttribute: now sums paid/deferred/reinvested
- InvestorProfitBalance.reverseEarned: guard prevents negative pending_balance
- ProfitDistributionItem.cancelPayment: REOPENED status now reverses payment correctly
- Investment model: profitBalance/capitalBalance/distributionItems/capitalLedgerEntries relations added
- ProfitDistributionController.distribute: RuntimeException now returns user-friendly error instead of 500
- ProfitPaymentController: axios replaces fetch for CSRF compatibility with SESSION_ENCRYPT=true
- CapitalLedgerEntry.$fillable: status field added to fix withdrawal pending status bug
- ProfitDistributionController.show: items now include remaining_amount/effective_amount/total_paid/isFullySettled via setAttribute

---

## [v2.0] — Step 17 Phase 1 — 2026-07-11

### Advanced Profit Distribution

- Investor eligibility tracking per distribution period with admin override
- InvestorProfitBalance ledger: earned/paid/deferred/reinvested/pending per investor
- ProfitDistributionItemPayment: full payment lifecycle (partial/paid/deferred/reinvested/cancelled/reopened)
- Extended ProfitDistributionItem: distribution_percent per investor, deferred/reinvested amounts, carry-forward
- ProfitPaymentController: pay/defer/reinvest/cancel/reopen payment actions (JSON responses)
- DistributionReverseController: reverse approved/distributed distributions back to draft
- InvestorBalanceController: index + show with recharts AreaChart earnings visualization
- New components: EligibilityPanel, ExtendedPaymentModal, PaymentHistoryModal, ReverseDistributionModal
- New pages: InvestorBalances/Index.tsx, InvestorBalances/Show.tsx
- Step17PermissionSeeder: eligibility/reverse/payment/investor_balance.view (Admin only)
- Mantine UI v8 installed: @mantine/core/dates/carousel/charts/tiptap + dayjs

### Critical Bug Fixes

- forceFill()->save() required for payment_status and distribution status transitions (mass assignment guard)
- ProfitDistribution.approve()/distribute()/reverse() converted to forceFill
- ProfitDistributionItem.syncPaymentStatus() converted to forceFill
- InvestorBalanceController.show() uses separate withTrashed() load after pagination (eager load limitation)
- Show.tsx Ziggy route fixed: named parameter `{ profit_distribution: id }` required

---

## [v1.9] — Step 16 — 2026-07-09

### Reports

- ReportController: 7 report types + single export() dispatcher
- Reports: Sales, Purchases, Expenses, ProfitLoss, Inventory, CustomerLedger, Investments
- PDF via dompdf (DejaVu Sans, flexbox, A4 landscape); CSV via streamDownload; Excel via maatwebsite
- ReportFilters.tsx + ExportBar.tsx shared components
- Step16PermissionSeeder: report.view (Admin+Staff), report.export (Admin only)

### Security

- SecurityHeaders middleware (CSP, X-Frame-Options, X-XSS-Protection, Referrer-Policy)
- ValidateSortColumn middleware with per-module column allowlists
- Session security: SESSION_ENCRYPT=true, HTTP_ONLY=true, SAME_SITE=lax
- Rate limiting on pos.sales.store, invoices.pdf, investments.export, reports.export, settings.logo

---

## [v1.8] — Step 15 — 2026-07-08

### Dashboard & Analytics

- Single AJAX endpoint GET /backend/dashboard/data returning all KPIs in one response
- Auto chart granularity: daily for ≤60 day ranges, monthly for >60 days
- recharts ComposedChart (Sales trend: Bar+Line), PieChart (payment/expense breakdown)
- 13 dashboard components: PeriodFilter, FinancialSummary, SalesChart, SalesAnalytics,
  SalesAnalyticsChart, ExpenseBreakdown, InventoryPanel, CustomerAnalytics, ProductAnalytics,
  NeedsAttention, RecentActivities, NotificationsPanel, RecentSales
- NeedsAttention returns null when all counts zero (no empty amber box)
- HandleInertiaRequests shares globally: auth.user, flash, ziggy, notifications

---

## [v1.7] — Step 14 — 2026-07-07

### Profit Distribution

- Snapshot accounting: financial figures frozen at distribution time
- calculatePreview() AJAX endpoint: revenue, COGS, expenses, per-investor shares
- approve() locks distribution (is_locked=true); distribute() validates all items settled
- generateDistributionNo(): PD-YYYY-000001 with lockForUpdate() inside DB::transaction()
- ProfitDistributionItem: per-investor share snapshot, markAsPaid/markAsCancelled
- Step14PermissionSeeder: view/create/edit/delete/restore/approve

---

## [v1.6] — Step 13 — 2026-07-07

### Investment Management

- Investment model with SoftDeletes, attachment (image/pdf/doc/xlsx), status tracking
- attachment_url accessor must be appended explicitly
- Export: CSV (native), Excel (InvestmentExport via maatwebsite), PDF (dompdf)
- buildExportQuery() private method for shared filter logic
- show() passes investmentTypes prop for edit modal
- Step13PermissionSeeder

---

## [v1.5] — Step 12 — 2026-07-07

### Expense Management

- Expense model with SoftDeletes, attachment, no approval workflow (no status column)
- ExpenseController with bulk action (delete/restore) and individual restore
- Step12PermissionSeeder

---

## [v1.4] — Step 11 — 2026-07-06

### Hold Orders

- HoldOrder + HoldOrderItem: ephemeral POS data, hard delete only (no soft delete, no restore)
- Lifecycle: active → processing (on resume) → hard delete after successful Sale
- release() reverts processing → active on failure/cancel
- HoldOrderController uses AuthorizesRequests + $this->authorize('edit', $holdOrder)
- CartSidebar Hold Order button (blue-300 border); HoldOrdersDrawer (right slide panel)
- Step11PermissionSeeder

---

## [v1.3] — Step 10 — 2026-07-06

### Invoice & Receipt

- InvoiceController reuses sales + sale_items + business_settings (no new tables)
- PDF via barryvdh/laravel-dompdf; logo uses public_path() (not URL)
- DomPDF limitation: CSS Grid not supported — flexbox only
- InvoicePrintView component for browser print
- Step10PermissionSeeder

---

## [v1.2] — Step 09 — 2026-07-05

### POS / Cart / Sale

- SaleController.store() returns JSON {id, reference_no} — not redirect (axios.post in frontend)
- SaleStockService: stock reversal on sale delete via reverseStock()
- ProductGrid with barcode, images, discount support
- ProductDetailModal: image slider (Mantine Carousel), price with discount, add to cart
- CartItem leave animation via onTransitionEnd
- ReceiptModal post-checkout
- Step09PermissionSeeder: Admin all, Staff sale.view + sale.create

---

## [v1.1] — Step 08 — 2026-07-05

### Customer Management

- Customer model with SoftDeletes and restore
- opening_balance: historical balance only (not related to current orders)
- Step08PermissionSeeder

---

## [v1.0] — Steps 00–07 — 2026-06-30

### Foundation

- Step 00: Project standards finalized (naming, folder structure, permission strategy)
- Step 01: Laravel 12 + Breeze (React+Inertia+TypeScript), Tailwind v4, Spatie Permission, Ziggy
- Step 02: Auth, User CRUD, Roles & Permissions, Login History, Activity Log, RecordLoginHistory listener
- Step 03: BusinessSettings (key-value), PaymentMethods, ExpenseCategories, InvestmentTypes
- Step 04: ProductCategories (self-referential), Units, Products (full spec), ProductImages
- Step 05: Notification system (UUID PK, DatabaseNotification), unread count in HandleInertiaRequests
- Step 06: Supplier management with restore
- Step 07: Purchase + PurchaseItems + PurchasePayments, StockMovement (polymorphic),
  PurchaseStockService (weighted average cost), SaleStockService
