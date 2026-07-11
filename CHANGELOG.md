# Changelog — Master POS System

## [v2.0] - Step 17 Phase 1 — 2026-07-11

- Advanced Profit Distribution: eligibility tracking per investor per period
- InvestorProfitBalance ledger: earned/paid/deferred/reinvested/pending tracking
- ProfitDistributionItemPayment: full payment lifecycle (partial/paid/deferred/reinvested/cancelled/reopened)
- Extended ProfitDistributionItem: distribution_percent override, deferred/reinvested amounts, carry-forward
- ProfitPaymentController: pay/defer/reinvest/cancel/reopen payment actions
- DistributionReverseController: reverse approved/distributed back to draft
- InvestorBalanceController: index + show with earnings chart
- EligibilityPanel, ExtendedPaymentModal, PaymentHistoryModal, ReverseDistributionModal components
- InvestorBalances/Index.tsx, InvestorBalances/Show.tsx pages
- Step17PermissionSeeder: eligibility/reverse/payment/investor_balance.view permissions
- forceFill() fix for payment_status and distribution status transitions (Rule 66)
- Mantine UI v8 installed: @mantine/core/dates/carousel/charts/tiptap

## [v1.9] - Step 16 — 2026-07-09

- ReportController: 7 report types + export dispatcher (CSV/Excel/PDF)
- Sales, Purchases, Expenses, ProfitLoss, Inventory, CustomerLedger, Investments reports
- PDF via dompdf (DejaVu Sans, flexbox, A4 landscape); CSV via streamDownload
- SecurityHeaders middleware (CSP, X-Frame-Options); ValidateSortColumn middleware
- Rate limiting on heavy routes; session security config
- Step16PermissionSeeder: report.view, report.export

## [v1.8] - Step 15 — 2026-07-08

- DashboardController: single /dashboard/data endpoint, all KPIs in one response
- Auto chart granularity: daily ≤60d, monthly >60d; recharts ComposedChart + PieChart
- NeedsAttention panel (hidden when all counts zero); 13 dashboard \_components/
- ActivityLog.php must have user() BelongsTo with withTrashed()

## [v1.7] - Step 14 — 2026-07-07

- ProfitDistribution snapshot accounting; approve/distribute/updateItemPayment workflow
- Distribution locking after approval; generateDistributionNo() with lockForUpdate()
- Step14PermissionSeeder: profit_distribution.view/create/edit/delete/restore/approve

## [v1.6] - Step 13 — 2026-07-07

- Investment model with SoftDeletes, attachment accessor, export (CSV/Excel/PDF)
- InvestmentExport (maatwebsite/excel); buildExportQuery() private helper
- Step13PermissionSeeder

## [v1.5] - Step 12 — 2026-07-07

- Expense model with SoftDeletes; ExpenseController with bulk action and restore
- expenses table has NO status column (no approval workflow)
- Step12PermissionSeeder

## [v1.4] - Step 11 — 2026-07-06

- HoldOrder + HoldOrderItem (hard delete only, NO soft delete)
- resume() marks processing; hard delete after successful Sale; release() reverts to active
- HoldOrderController uses AuthorizesRequests + $this->authorize('edit', $holdOrder)
- Step11PermissionSeeder

## [v1.3] - Step 10 — 2026-07-06

- InvoiceController reusing Sale + SaleItem; PDF via dompdf (public_path for logo)
- DomPDF does NOT support CSS Grid — flexbox/tables only in Blade templates
- Step10PermissionSeeder

## [v1.2] - Step 09 — 2026-07-05

- SaleController.store() returns JSON (not redirect) for POS axios checkout
- SaleStockService for stock reversal on delete; ProductDetailModal with image slider
- CartItem leave animation via onTransitionEnd; handleResumeHoldOrder normalizes Number()
- Step09PermissionSeeder

## [v1.1] - Step 08 — 2026-07-05

- Customer model with SoftDeletes and restore; Step08PermissionSeeder

## [v1.0] - Steps 00–07 — 2026-06-30

- Step 00: Project standards (naming, folder structure, permission strategy)
- Step 01: Laravel 12 + Breeze + Inertia + TypeScript + Ziggy + Spatie Permission
- Step 02: Auth, roles, permissions, login history, activity log
- Step 03: Business settings, payment methods, expense categories, investment types
- Step 04: Products, categories, units, images (polymorphic)
- Step 05: Notification system (UUID, DatabaseNotification)
- Step 06: Supplier management with restore
- Step 07: Purchase & inventory (polymorphic stock movements, weighted average cost)
