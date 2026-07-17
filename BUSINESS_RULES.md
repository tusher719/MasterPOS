# Business Rules — Master Business Suite

> Describes HOW the business works. Permanent domain logic.
> These rules must be respected regardless of implementation changes.

---

## 1. Financial Domain Separation — The Most Critical Rule

The system is divided into two permanently independent financial domains:

### Capital Domain

Tracks money entering and leaving the business.

- Central entity: **Investment**
- Responsibilities: Investments, Capital Ledger, Capital Withdrawals, Investor Statements, Business Funding, Investment-to-Business Tracking
- Capital status (active/withdrawn) is determined only by actual capital activity
- Capital amount NEVER determines profit entitlement

### Profit Domain

Tracks profit entitlement, calculation, and settlement.

- Central entity: **Partner**
- Responsibilities: Profit Rules, Profit Eligibility, Profit Distribution, Settlement
- Profit share is ALWAYS sourced from manually configured Partner Profit Rules
- Profit eligibility is completely independent of capital status

### Linking

- `partner_investments` table links a Partner to one or more Investments
- A Partner with no investments (working partner, product partner) is fully valid
- An Investment with no partner link is fully valid (backward compatibility)

**This separation is permanent and must never be violated.**

---

## 2. Partner Rules

### Partner Types

A single partner may hold multiple types simultaneously:

| Type      | Description                       | Settlement                 |
| --------- | --------------------------------- | -------------------------- |
| `capital` | Contributes money to the business | Profit only                |
| `working` | Contributes labor or management   | Profit only                |
| `product` | Provides inventory for sale       | Cost return + profit share |

Type flags are non-exclusive — a partner can be `capital + working`, `product + working`, or all three.

### Partner Lifecycle

- Partners are soft-deleted — all historical profit, capital, and distribution records are preserved
- A deactivated partner receives no new profit distributions
- Existing distributions for a deactivated partner remain valid and must be settled

### Partner Code

- Format: PTR-001, PTR-042, etc.
- Auto-generated at creation, unique, immutable after creation

---

## 3. Profit Rules — Core Business Logic

### Rule Configuration

- Every partner has one or more `partner_profit_rules`
- `share_percent` is manually entered by admin — never calculated from capital amount
- Example: Partner A → 35%, Partner B → 20%, regardless of how much capital each has invested

### Rule Types

| rule_type       | Description                                |
| --------------- | ------------------------------------------ |
| `fixed_percent` | A fixed percentage of distributable_amount |
| `product_based` | Profit only from assigned products         |
| `capital_based` | Legacy mode — backward compatible only     |
| `mixed`         | Multiple sources combined                  |

### Rule Versioning

Rules support historical versioning via `effective_from` and `effective_to`:

```
January → March:   Partner A = 35%  (effective_from: Jan 1, effective_to: Mar 31)
April → ongoing:   Partner A = 25%  (effective_from: Apr 1, effective_to: null)
```

- When a rule changes, the old rule gets `effective_to` set — it is NEVER deleted
- A new rule is created with `effective_from` set to the change date
- Historical distributions always resolve the rule active at their `period_start`
- Future distributions use the newest active rule

### Rule Approval Workflow

- New rules and rule changes require Super Admin approval before taking effect
- Pending rules have `approved_by = null` — they are INVISIBLE to all calculation engines
- Only approved rules (`approved_by IS NOT NULL`) are used in calculations
- Every rule change is recorded in `partner_profit_rule_history` (append-only)

### Rule Resolution at Calculation Time

Given distribution `period_start = 2026-04-01`:

- Find rules where `effective_from <= 2026-04-01`
- AND `effective_to IS NULL OR effective_to >= 2026-04-01`
- AND `approved_by IS NOT NULL`
- Use the most recent matching rule

---

## 4. Profit Eligibility Rules

### Eligibility is Independent of Capital

A partner's capital status and profit eligibility are completely separate:

- Capital = Active, Profit = Paused → capital stays, no new profit generated
- Capital = Withdrawn, Profit = Active → unlikely but structurally valid

### Eligibility Configuration

Every partner must have a `partner_profit_eligibilities` record to receive profit.

| Field               | Description                         |
| ------------------- | ----------------------------------- |
| `profit_start_date` | From when this partner earns profit |
| `profit_end_date`   | Until when (null = ongoing)         |
| `status`            | active / paused / ended             |

### Eligibility Check at Distribution Time

A partner is eligible for a distribution period ONLY IF:

- An active eligibility record exists
- `profit_start_date <= period_start`
- `profit_end_date IS NULL OR profit_end_date >= period_end`
- `status = 'active'`

Partial coverage = ineligible. The eligibility record must cover the ENTIRE period.

### Pause and Resume

- Admin can pause a partner's profit eligibility at any time (with mandatory reason)
- Pausing does NOT affect capital — investment remains active
- Resuming creates a new eligibility record effective from the resume date
- Historical distributions during pause period are never generated
- Resuming creates a NEW eligibility record — the old paused record is never mutated back to active
- The paused record is updated with resumed_by/resumed_at for audit purposes only
- Only one active eligibility record per partner is allowed at any time

---

## 5. Product Partner Rules

### Business Model

A product partner provides inventory instead of money.

Example:

```
Product cost price:     500 BDT
Product sale price:     700 BDT
Profit per unit:        200 BDT
Partner profit share:   65%

Settlement per unit:
  Cost return:          500 BDT  (if cost_return_enabled = true)
  Profit share:         200 × 65% = 130 BDT
  Total payable:        630 BDT
```

### Product Assignment Rules

- A product assignment links a partner to a product (or future: category, brand)
- Assignment has `effective_from` and `effective_to` dates
- Sales of assigned products generate profit for the partner ONLY within the effective period
- Sales before `effective_from` or after `effective_to` generate NO profit for that partner
- Assignments require Super Admin approval before taking effect

### Assignment Scope

Current supported scope: individual products (`assignable_type = 'product'`)
Future scope (no schema change required): categories, brands, warehouses, departments

### Multiple Partners per Product

For simplicity, the current system assigns one product partner per product.
The schema (`assignable_type`, `assignable_id`) already supports multiple partners per product when required.

---

## 6. Settlement Rules

### Settlement Types per Partner

| Partner Type    | Settlement Type    | What is Paid               |
| --------------- | ------------------ | -------------------------- |
| Capital Partner | `profit_only`      | Profit share only          |
| Working Partner | `profit_only`      | Profit share only          |
| Product Partner | `cost_plus_profit` | Cost return + profit share |
| Mixed Partner   | Combination        | Per applicable rules       |

### Settlement Snapshot

At distribution approval time, the settlement type is frozen into `profit_distribution_items.profit_rule_snapshot` (JSON). This snapshot is immutable — settlement amounts are NEVER recalculated from live config after approval.

### Settlement Config Approval

Changes to `partner_settlement_configs` require Super Admin approval.

---

## 7. Profit Calculation Engine

### Source Type

Every `profit_distribution` has a `source_type`:

| source_type        | Engine Used                             | When Used                                |
| ------------------ | --------------------------------------- | ---------------------------------------- |
| `investment_based` | CapitalBasedStrategy                    | Legacy distributions (all existing data) |
| `partner_based`    | Strategy dispatch per partner rule_type | All new distributions                    |

### Calculation Strategies

| Strategy               | Input                                          | Output                     |
| ---------------------- | ---------------------------------------------- | -------------------------- |
| `FixedPercentStrategy` | partner's share_percent + distributable_amount | share_amount               |
| `ProductBasedStrategy` | assigned products + sale data in period        | cost + profit share        |
| `CapitalBasedStrategy` | investment amount / total investment pool      | share_amount (legacy only) |
| `MixedStrategy`        | multiple applicable strategies                 | sum of all results         |

### Engine Contract

- Engine NEVER writes to database — it returns a preview array only
- Snapshot is written by `ProfitDistributionController::store()`, not the engine
- Engine always uses rule and eligibility versions active at `period_start`

---

## 8. Profit Distribution Rules

### Snapshot Accounting

- Financial figures (revenue, COGS, expenses, shares) are FROZEN at distribution time
- Approved snapshots are NEVER recalculated or overwritten
- "Recalculate" on Edit page replaces snapshot + items together — not partial update
- `profit_rule_snapshot` JSON column stores the exact rule state used at calculation time

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

### Investor Eligibility (Legacy — investment_based only)

- Auto-determined by: investment_date ≤ period_start
- Admin can manually override eligibility with mandatory reason
- Applies ONLY to `source_type = 'investment_based'` distributions
- For `partner_based` distributions, partner_profit_eligibilities table is used

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

---

## 9. Investment Rules

- Investments track capital — not profit
- Investments have two statuses: active and withdrawn
- Only actual capital withdrawal changes the investment status
- Capital is tracked in Capital Ledger (Phase 2)
- investment.amount is the capital contributed — NEVER the profit received
- Each investment may optionally link to one Partner via partner_investments
- A partner may have multiple investments (multiple capital contributions)

---

## 10. Investment-to-Business Tracking

When a capital withdrawal is approved, the withdrawn funds can be linked to a specific business transaction:

- A `capital_ledger_entry` (withdrawal, approved) → linked to a `purchase` or `expense`
- Link stored in `investment_fund_usages` table
- `usable_type`: 'purchase' or 'expense'
- `usable_id`: the ID of the purchase or expense record
- Link is optional — not every withdrawal must be linked to a business transaction
- One withdrawal entry can fund multiple transactions (one-to-many)
- One transaction cannot be funded by multiple withdrawal entries (enforced at application layer)

---

## 11. Expense Rules

- Expenses have NO approval workflow — every recorded expense is final
- expenses table has NO status column
- All expenses in a period are included in profit calculations (no filtering)
- Expenses are soft-deleted but never approved/rejected

---

## 12. Sales Rules

- Sales are the primary revenue source for profit calculations
- Revenue = sum of sales.grand_total in period
- COGS = sum of (sale_items.quantity × products.average_cost) in period
- Gross Profit = Revenue - COGS
- Net Profit = Gross Profit - Total Expenses

For product-based partner profit:

- Only sales of products assigned to that partner during the assignment effective period are counted
- Sale date must fall within assignment effective_from → effective_to range

---

## 13. Audit Trail Rules

- Every financial configuration change writes to `partner_profit_rule_history`
- `ActivityLogService::log()` is called on every create/update/delete operation
- `partner_profit_rule_history` is append-only — no updates, no deletes ever
- Approval actions record `approved_by` + `approved_at` on the config record
- Nothing in the financial domain silently changes

---

## 14. Purchase Rules

- Purchases track stock intake and supplier payments
- Stock movements are recorded polymorphically (reference_type + reference_id)
- Average cost uses weighted average method: updated on each purchase
- Purchase payments can be partial — purchase tracks paid_amount and due_amount
- Purchase status and payment status are separate concerns

---

## 15. Customer Rules

- opening_balance is for historical balances BEFORE using this POS only
- Positive opening_balance = customer owes the business
- Negative opening_balance = business owes the customer
- NOT related to current orders or sales in the system

---

## 16. Inventory Rules

- Stock quantity tracked on products table (stock_qty column)
- Stock movements recorded for every intake (purchase) and outflow (sale)
- Low stock alert triggered when stock_qty < low_stock_threshold
- Average cost updated using weighted average on every purchase
- Stock reversed when sale is deleted (SaleStockService::reverseStock())
- Stock reversed when purchase is deleted (PurchaseStockService)

---

## 17. Report Rules

- Reports aggregate from existing tables — no new tables needed
- Profit/Loss report uses: Revenue - COGS - Expenses = Net Profit
- Inventory report joins use products.category_id (not product_category_id)
- Customer Ledger: tfoot totals recalculate from filtered array (not summary props)
- All reports support date range filtering with period_start/period_end
- Reports available: Sales, Purchases, Expenses, ProfitLoss, Inventory, CustomerLedger, Investments
- Export formats: CSV (native), Excel (maatwebsite), PDF (dompdf)

---

## 18. Dashboard Rules

- Dashboard aggregates ALL KPIs in a single endpoint (no multiple fetch calls)
- Period filter re-triggers full data fetch
- Chart granularity auto-switches: daily for ≤60 days, monthly for >60 days
- NeedsAttention panel hidden when all counts are zero (no empty UI)
- Dashboard accessible to all authenticated users (no specific permission)

---

## 19. Notification Rules

- Low stock: triggered when stock_qty drops below low_stock_threshold
- New sale: triggered on every completed sale
- New expense: triggered on every recorded expense
- Notifications stored in database (Laravel DatabaseNotification)
- Unread count + latest 8 notifications shared globally via HandleInertiaRequests

---

## 20. Accounting Principles

### COGS Calculation

- Uses weighted average cost (products.average_cost) at time of report
- Not a real-time COGS per sale — approximation based on current average cost

### Profit Distribution Period

- Period defined by period_start and period_end dates
- Revenue: all sales with sale_date in period
- Expenses: all expenses with expense_date in period
- Both use inclusive date range

### Investment Share Calculation (Legacy — investment_based only)

- Share percent = (investor amount / total active investment) × 100
- Share amount = (share_percent / 100) × distributable_amount
- Calculated at preview time, frozen as snapshot at store time
- Applies ONLY to distributions where source_type = 'investment_based'

### Partner Share Calculation (New — partner_based)

- Share percent = partner_profit_rules.share_percent (manually configured)
- Share amount = (share_percent / 100) × distributable_amount (for fixed_percent strategy)
- Product partner: share amount = sum of (product profit × profit_share_percent) for assigned products in period
- Always resolved from the rule active at period_start — never current rule
