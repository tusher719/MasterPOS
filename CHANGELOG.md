# Changelog — Master POS System

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
