# Business Rules — Master POS System

> Describes HOW the business works. Permanent domain logic.
> These rules must be respected regardless of implementation changes.

---

## 1. Profit & Capital Separation

**The most critical business rule in this system:**

- Capital and Profit are ALWAYS tracked in separate ledgers
- InvestorProfitBalance = profit ledger only
- CapitalLedger (Phase 2) = capital ledger only
- Never mix capital and profit calculations
- Reinvestment = profit moving to capital — both ledgers must update independently

---

## 2. Profit Distribution Rules

### Snapshot Accounting

- Financial figures (revenue, COGS, expenses, shares) are FROZEN at distribution time
- Approved snapshots are NEVER recalculated or overwritten
- "Recalculate" on Edit page replaces snapshot + items together — not partial update

### Distribution Lifecycle

- States: draft → approved → distributed
- Draft: fully editable, not locked
- Approved: locked (is_locked=true), payments can be recorded
- Distributed: all items settled, final state
- No edit after approval — use Reverse workflow instead

### Reverse Workflow

- Reverse returns distribution to draft
- All payments cancelled and balance credits reversed
- Distribution unlocked for editing
- Reason required (min 10 characters)
- Only approved or distributed distributions can be reversed

### Investor Eligibility

- Auto-determined by: investment_date ≤ period_start
- Mid-period investors (investment_date > period_start) are ineligible by default
- Admin can manually override eligibility with a mandatory reason
- Eligibility reason recorded for audit trail
- Eligibility generated automatically on approve()

### Payment States

- pending → partial → paid (cash payments)
- pending → deferred (carry forward to next period)
- pending → reinvested (convert to capital)
- paid/partial/deferred/reinvested → cancelled (with balance reversal)
- cancelled → reopened (reactivate without amount)
- isTerminal: paid, reinvested, cancelled — cannot transition without reopen

### Investor Profit Balance

- credited on distribution approve (creditEarned)
- debited on payment recording (recordPayment/recordDeferred/recordReinvested)
- reversed on payment cancellation
- reversed entirely on distribution reverse
- Payment cannot exceed pending_balance

### Distribution Percentage

- distribution_percent at distribution level: % of net_profit to distribute (global)
- distribution_percent at item level: per-investor override of their share
- effectiveAmount = share_amount × (item.distribution_percent / 100)

---

## 3. Investment Rules

- Investments have two statuses: active and withdrawn
- Only active investments are included in profit distribution calculations
- Withdrawn investments retain their historical distribution records
- Capital is tracked separately from investment records (Phase 2)
- Each investment has exactly ONE InvestorProfitBalance record (unique constraint)
- Investment amount is the capital contributed — never the profit received

---

## 4. Expense Rules

- Expenses have NO approval workflow — every recorded expense is final
- expenses table has NO status column
- All expenses in a period are included in profit calculations (no filtering)
- Expenses are soft-deleted but never approved/rejected

---

## 5. Sales Rules

- Sales are the primary revenue source for profit calculations
- Revenue = sum of sales.grand_total in period
- COGS = sum of (sale_items.quantity × products.average_cost) in period
- Gross Profit = Revenue - COGS
- Net Profit = Gross Profit - Total Expenses

### Payment Status

- paid: full payment received at sale time
- partial: partial payment received
- due: no payment received

### Hold Order Rules

- Hold Orders are ephemeral — they exist only between "hold" and "resume/cancel"
- Hard delete only — no soft delete, no restore, no trash
- Processing state: set when resumed from hold, prevents double-resume
- Active state: restored if sale fails or is cancelled via release()
- Deleted permanently after successful sale

---

## 6. Purchase Rules

- Purchases track stock intake and supplier payments
- Stock movements are recorded polymorphically (reference_type + reference_id)
- Average cost uses weighted average method: updated on each purchase
- Purchase payments can be partial — purchase tracks paid_amount and due_amount
- Purchase status and payment status are separate concerns

---

## 7. Customer Rules

- opening_balance is for historical balances BEFORE using this POS only
- Positive opening_balance = customer owes the business
- Negative opening_balance = business owes the customer
- NOT related to current orders or sales in the system

---

## 8. Inventory Rules

- Stock quantity tracked on products table (stock_qty column)
- Stock movements recorded for every intake (purchase) and outflow (sale)
- Low stock alert triggered when stock_qty < low_stock_threshold
- Average cost updated using weighted average on every purchase
- Stock reversed when sale is deleted (SaleStockService::reverseStock())
- Stock reversed when purchase is deleted (PurchaseStockService)

---

## 9. Report Rules

- Reports aggregate from existing tables — no new tables needed
- Profit/Loss report uses: Revenue - COGS - Expenses = Net Profit
- Inventory report joins use products.category_id (not product_category_id)
- Customer Ledger: tfoot totals recalculate from filtered array (not summary props)
- All reports support date range filtering with period_start/period_end
- Reports available: Sales, Purchases, Expenses, ProfitLoss, Inventory, CustomerLedger, Investments
- Export formats: CSV (native), Excel (maatwebsite), PDF (dompdf)

---

## 10. Dashboard Rules

- Dashboard aggregates ALL KPIs in a single endpoint (no multiple fetch calls)
- Period filter re-triggers full data fetch
- Chart granularity auto-switches: daily for ≤60 days, monthly for >60 days
- NeedsAttention panel hidden when all counts are zero (no empty UI)
- Dashboard accessible to all authenticated users (no specific permission)

---

## 11. Notification Rules

- Low stock: triggered when stock_qty drops below low_stock_threshold
- New sale: triggered on every completed sale
- New expense: triggered on every recorded expense
- Notifications stored in database (Laravel DatabaseNotification)
- Unread count + latest 8 notifications shared globally via HandleInertiaRequests

---

## 12. Accounting Principles

### COGS Calculation

- Uses weighted average cost (products.average_cost) at time of report
- Not a real-time COGS per sale — approximation based on current average cost

### Profit Distribution Period

- Period defined by period_start and period_end dates
- Revenue: all sales with sale_date in period
- Expenses: all expenses with expense_date in period
- Both use inclusive date range

### Investment Share Calculation

- Share percent = (investor amount / total active investment) × 100
- Share amount = (share_percent / 100) × distributable_amount
- Calculated at preview time, frozen as snapshot at store time
