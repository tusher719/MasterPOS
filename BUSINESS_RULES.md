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

Resolution depends on how many rule_types the partner has:

**Case 1 — Single rule_type (e.g. fixed_percent only):**
Multiple versions of the same rule_type may exist due to versioning
(old rule gets effective_to set, new rule created with new effective_from).
In this case, use the most recent matching rule — the one with the
latest effective_from that still satisfies the date conditions above.

**Case 2 — Multiple rule_types (e.g. fixed_percent + product_based):**
A partner CAN have multiple active rules at the same time, provided each
rule has a different rule_type. These are not versions of the same rule —
they are independent income streams.
In this case, MixedStrategy is used: ALL applicable rules are resolved
independently and their results are summed to produce the partner's
total share_amount.

Example — Partner with capital + product type:
Rule A: fixed_percent, 25%, effective_from: Jan 1, effective_to: null
Rule B: product_based, 65%, effective_from: Jan 1, effective_to: null

Distribution period: Apr 1 → Apr 30

Rule A result: 25% of distributable_amount = 10,000 BDT
Rule B result: product sales profit × 65% = 5,200 BDT
Total share_amount: = 15,200 BDT

Rule to remember:

- Same rule_type → most recent matching rule (versioning)
- Different rule_type → all applicable rules summed (MixedStrategy)
- A partner cannot have two active rules of the same rule_type simultaneously

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

### Cost Return and Profit Share — Separate Tracking

- Cost Return and Profit Share are tracked in SEPARATE columns in partner_profit_balances.
- share_amount in profit_distribution_items = total payable (cost_return + profit_share combined).
- cost_return_amount in profit_distribution_items stores the cost portion separately.
- profit_share_amount = share_amount − cost_return_amount (derived, not stored).
- Payment splitting uses cost/profit ratio proportional to original cost_return_amount vs share_amount.
- If cost_return_enabled = false on assignment, cost_return_amount = 0 and full amount is profit share.
- PartnerProfitBalanceService is the single authority for all balance credit/debit/reversal operations.
- creditEarned() called on distribution approve inside DB::transaction().
- recordPayment() called from ProfitDistributionItem::markAsPaid/Deferred/Reinvested().
- reversePayment() called from ProfitDistributionItem::cancelPayment().
- reverseEarned() called on distribution reverse for each partner-based item.

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

- Changes to `partner_settlement_configs` require Super Admin approval
- Pending configs (approved_by IS NULL) are immutable-pending — visible but not yet in effect
- Approved configs are immutable — edit/delete blocked; delete and recreate to change
- Only paid/reinvested distribution statuses lock a partner's period in overlap checks
- Deferred status = unpaid/postponed — period remains open for the next distribution

### Per-Stream Settlement Config (Gap 2.3)

- A Mixed Partner can have multiple active settlement configs simultaneously,
  one per stream (capital / working / product / all).
- `applies_to = 'all'` is the fallback — used when no stream-specific config exists.
- Option A resolution: specific stream config always wins over 'all' config.
- One active config per partner per `applies_to` value enforced at controller level.

### Per-Stream Eligibility (Gap 2.3)

- A Mixed Partner can have multiple active eligibility records simultaneously,
  one per stream (capital / working / product / all).
- Pausing one stream's eligibility does not affect other streams.
- Resume carries forward the `applies_to` value from the paused record.
- One active eligibility record per partner per `applies_to` value enforced
  at service layer (PartnerEligibilityService::create() throws RuntimeException).

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

## 22. Sale Payment Rules (Item 4.3)

- sale_payments is the authoritative source for all payment tracking — sales.paid_amount is derived, never set directly after creation
- recalculatePaymentStatus() on Sale model must be called after every payment insert, update, or delete — never update paid_amount manually
- Only verified payments (payment_status_manual = 'verified') count toward paid_amount
- pending_verification and rejected payments do not affect paid_amount or payment_status
- POS payments are immediately verified (payment_status_manual = 'verified', verified_by = current user, verified_at = now())
- Storefront manual payments start as pending_verification — verified by admin in Item 10.6
- payment_charge is stored on sale_payments, not on the sales table — charge is per payment entry
- COD sales have paid_amount = 0 at creation — no payment row is created until Item 4.5 (delivery + collection)
- One sale can have multiple payment entries (partial payments, additional payments collected later)
- payment_method_bank_id is only set when payment_method.type = 'bank_transfer'

---

## 24. COD Payment Collection Rules (Item 4.5)

- COD payment collection is a single combined action — delivery_status → delivered,
  order_status → delivered, SalePayment created in one DB::transaction()
- Partial collection allowed — customer can pay less than grand_total/due_amount
- Already-delivered guard prevents duplicate collection (idempotency check on backend)
- "Collect" button shown only when: payment_type=cash_on_delivery AND
  delivery_status≠delivered AND deleted_at IS NULL AND can.create=true
- Collection creates a verified SalePayment immediately (payment_status_manual='verified')
- recalculatePaymentStatus() called after every collection — single source of truth

---

## 23. POS Payment Type Rules (Item 4.4)

- payment_type is required at POS checkout — one of: full_paid / half_paid / cash_on_delivery
- COD sales: paid_amount = 0 at creation, no SalePayment row created — payment collected at delivery (Item 4.5)
- full_paid: paidAmount auto-fills to grandTotal (including payment charge)
- half_paid: paidAmount auto-fills to grandTotal / 2
- payment_charge base = subtotal − discount + tax (before charge is added)
- bank_transfer: charge applied at bank level (payment_method_banks.charge_value) — not at method level
- mobile_banking methods: transaction_id field shown at checkout
- bank_transfer methods: payment_reference field shown; bank sub-list shown for bank selection
- payment_charge stored on sale_payments row — not on sales table
- grandTotal on sales does NOT include payment_charge — charge is a pass-through cost tracked on the payment row

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
- Stock reservation window configurable via business_settings.stock_reservation_minutes (default: 30)
- Storefront orders reserve stock before payment — real deduction happens on payment verification
- POS sales bypass reservation — deduct stock directly via SaleStockService::applyStock()
- Expired reservations swept every 5 minutes via scheduler (reservations:sweep-expired)
- SaleStockService uses lockForUpdate() + DB::transaction() on all stock deductions

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

## 21. Capital Principal Lock Rules

### Lock Formula

- A Capital Partner's invested principal is partially or fully locked until
  business sales recover the equivalent amount.
- Formula:
  unlocked_amount = MIN(total_deposited, total_sales_since_investment_date)
  locked_amount = total_deposited − unlocked_amount
  available_to_withdraw = unlocked_amount − total_withdrawn

### Partial Unlock

- Unlock is proportional — if 60% of principal has been recovered through sales,
  60% of the principal is available to withdraw.
- Example: 100,000 BDT invested, 60,000 BDT in sales since investment date →
  60,000 BDT unlocked, 40,000 BDT locked.

### Sales Calculation

- total_sales_since_investment_date = SUM(sales.grand_total)
  WHERE sale_date >= investment.investment_date AND deleted_at IS NULL
- Aggregate sales only — no tracing of which specific product the money bought.
- Per-investment tracking: each investment uses its own investment_date as the floor.

### Enforcement

- Unlock status recomputed from live sales on:
    1. Capital Ledger Show page load
    2. Withdrawal request creation (pre-flight, before DB::transaction)
    3. Withdrawal approval (double guard, inside DB::transaction)
- Withdrawal blocked if amount > available_to_withdraw at both frontend and backend.
- Error shown to admin: "You can currently withdraw up to ৳X BDT — ৳Y BDT is
  still locked (Z% of principal has been recovered through sales)."

## 21. Delivery Rules (Item 4.2)

- Delivery type determines whether physical delivery is required:
  store_pickup = no delivery needed; inside_dhaka / outside_dhaka / parallel = delivery required
- delivery_charge is added to grand_total as a separate line item on top of subtotal − discount + tax
- delivery_charge_free flag forces delivery_charge to 0 regardless of the entered amount
- store_pickup always has delivery_charge = 0 and delivery_status = null (no tracking needed)
- delivery_status defaults to 'pending' when delivery_type requires delivery (non-store_pickup)
- delivery_address is mandatory when delivery_type is inside_dhaka, outside_dhaka, or parallel
- delivery_address is optional for store_pickup
- delivery_contact_phone is always optional — falls back to customer phone
- Delivery charge is never negative — validated at both frontend and backend
- effectiveDeliveryCharge() on Sale model is the authoritative method for computing the actual charge —
  always use this instead of reading delivery_charge directly

## 25. Sale Status History Rules (Item 4.7)

- sale_status_histories is an append-only audit table — never update or delete rows
- A new SaleStatusHistory row is written on every status-affecting action:
    - Sale created → status: 'processing', note: 'Sale created.'
    - COD payment collected → status: 'delivered', note: 'COD payment collected. Marked as delivered.'
    - Bulk status update → status: new_status, note: 'Bulk status update from {previous_status}.'
    - Individual status change (Item 4.8) → status: new_status, note: admin-supplied reason
- changed_by is always Auth::id() — never null for admin-triggered actions
- status column is varchar — stores order_status string values
- SaleStatusHistory::create() is the only write method — never use forceFill or raw query

## 25. Sale Status History Rules (updated — Item 4.8)

Individual status update (Item 4.8):

- Admin selects new status from UpdateOrderStatusModal — current status disabled (cannot re-select)
- Mandatory note/reason required (min 3 chars) before submit
- cancelled/returned statuses show amber warning: stock reverse NOT automatic — handle separately
- SaleStatusHistory::create() called inside DB::transaction() with forceFill on order_status
- changed_by = Auth::id() always
- payment_type field is immutable after sale creation — it records original intent, not current payment state
- Delivery type null on old sales (pre-Item 4.2) is expected — no bug

## 26. Sales History Page Rules (Item 4.7)

- sale_payments is eager loaded in salesList() — PaymentHistoryModal receives
  data directly from Inertia props; no separate fetch() call needed
- Bulk status update restricted to: confirmed, out_for_delivery only
  — cancelled / returned / delivered require per-sale individual action
  because these trigger stock reverse, payment collection, or audit events
- Delivery Slip PDF (A5 portrait) shows NO financial details — customer name,
  phone, address, items (name + qty only), courier info, delivery type/charge
  — safe to hand to courier without exposing unit costs or margin
- Add Payment button in PaymentHistoryModal hidden when due_amount = 0
  — fully paid sales cannot receive additional payments via this flow
- Payment charge stored per SalePayment row — never on sales table
- SaleController private helpers:
    - mapPaymentMethods() — single source for payment method mapping (DRY)
    - resolveBusinessProfile() — single source for business settings in PDFs (DRY)

## 27. Layer 1 Fraud Validation Rules (Item 6.2)

Layer 1 runs on every checkout attempt (POS + storefront) before any DB write.

### Phone

- Must match Bangladeshi mobile format: 01[3-9]XXXXXXXX (11 digits)
- Accepts +8801XXXXXXXXX and 8801XXXXXXXXX prefix variants
- Checked against: registered customer's phone OR walk-in phone typed at checkout

### Name (walk-in orders only)

- Cannot be purely numeric (e.g. a phone number entered as name)
- Must contain at least some letters (Latin or Bangla Unicode)
- Single character repeated 5+ times rejected (keyboard spam)
- Minimum 2 characters after trim

### Address (non-store_pickup delivery only)

- Minimum 3 words required
- Address composed entirely of digits, spaces, and punctuation rejected
- All words identical and shorter than 3 chars rejected

### Failure Behavior

- Layer 1 failure returns HTTP 422 {layer1_errors: {field: message}}
- Sale is never created on Layer 1 failure
- Errors shown in CheckoutPanel red block above checkout button
- layer1Errors cleared on every new checkout attempt
- No paid or external validation service used in Phase 1

## 28. Layer 2 IP Order Limit Rules (Item 6.3)

- Every checkout attempt (POS + storefront) is logged in order_attempt_logs
- Layer 2 runs AFTER Layer 1 — a Layer 1 failure does not consume an IP slot
- Rolling 24-hour window: WHERE ip_address = ? AND attempted_at >= NOW() - 24h
- count > limit triggers auto-block (not count >= limit — exactly-at-limit passes)
- Auto-block creates a fraud_flag (trigger_type = auto_layer2, flagged_by = null)
- fraud_flag creation failure is non-fatal — block decision is already made
- Limit configurable via business_settings.fraud_ip_order_limit_per_24h (default 3)
- order_attempt_logs is append-only — never updated or deleted (audit log)

## 29. Layer 3 Success Ratio Rules (Item 6.4)

- Layer 3 runs only after Layer 1 + Layer 2 both pass — pre-flight, outside DB::transaction()
- Phone required — no phone means Layer 3 is skipped (fail open)
- New customers (total orders < fraud_min_orders_before_check) always pass Layer 3
- Total orders matched by: customer.phone OR delivery_contact_phone (walk-in)
- Voided sales (deleted_at IS NOT NULL) excluded from both total and delivered counts
- Success ratio = round((delivered / total) \* 100) as integer percent
- Block condition: ratio < threshold (not <=) — exactly-at-threshold passes
- Auto-block creates fraud_flag (trigger_type=auto_layer3, flagged_by=null, status=pending_review)
- fraud_flag creation failure is non-fatal — block decision already made before flag write
- Threshold configurable: business_settings.fraud_success_ratio_threshold (default 60)
- Min orders configurable: business_settings.fraud_min_orders_before_check (default 3)
- Layer 3 response shape: {layer3_blocked: true, reason: 'low_success_ratio'}

## 30. Navbar Logo Rules (Item 1.2)

- logo_type controls navbar display: image / text / both
- logo_image_path is the canonical key — set on every logo upload alongside business_logo
- business_logo key retained for PDF Blade templates (dompdf uses public_path())
- logo_text_segments: JSON array of {text, color} objects, max 5 segments
- both mode: image renders at max-h-7 max-w-[36px], text segments alongside
- Save auto-reloads page (800ms delay) so globally shared settings prop refreshes
- Settings page uses pageSettings Inertia prop (not settings) to avoid conflict with global flat map
- window.axios.post() used for logo style save — useForm.transform() returns void in Inertia

## Theme System Rules

1. theme*json/ui_json always merged with DEFAULT*\* on read
   → Frontend never receives null/missing keys

2. Primary color stored as RGB triplet in CSS var
   → Tailwind bg-primary/10, text-primary etc work automatically

3. Sidebar uses --theme-sidebar-_ CSS vars
   → Avoids conflict with shadcn's --sidebar-_ variables

4. Dark mode: html.dark class controlled by ThemeProvider
   → MantineProvider defaultColorScheme:'auto' follows this class
   → body/cards/navbar dark automatically via Tailwind .dark variants

5. Font family: triple override required
   → CSS var: root.style.setProperty('--font-sans', value)
   → HTML: root.style.fontFamily = value
   → Body: document.body.style.fontFamily = value
   (Tailwind static font-sans class would otherwise override)

6. Sidebar width/density/card-style: visual-only in Item 1.3
   → Full apply in Item 1.20 Dark Mode

7. Destructive buttons always red — never use primary color
8. Unsaved changes show amber banner with Discard + Save
9. Toast: "Theme preferences saved successfully." on save
10. Reset: axios.post() to theme.reset endpoint → toast

## 31. System Status Rules (Item 1.16)

### Maintenance Mode

- `maintenance_mode_enabled = true` → all backend and POS routes show MaintenancePage (HTTP 503)
- Super Admin (role: 'Admin') always bypasses maintenance mode — never locked out
- Non-Admin authenticated staff see maintenance page immediately on next request
- JSON/API requests return `{"message": "Service Unavailable"}` HTTP 503 — no Inertia page
- Controlled via Settings → System Status tab (admin only)
- `CheckMaintenanceMode` middleware applied to backend route group only

### Coming Soon Mode

- `coming_soon_mode_enabled = true` → public website (storefront) shows ComingSoonPage (HTTP 503)
- Backend and POS routes are completely unaffected
- `CheckComingSoon` middleware will be applied to storefront routes in Sprint 8
- Middleware is registered and ready — no code change needed when storefront arrives

### 500 Error Page

- Any unhandled server exception (5xx) renders `Error/ServerError` branded page
- Surface detection: `/backend/pos/*` → pos, `/backend/*` → backend, else → public
- Backend/POS surface: uses AuthenticatedLayout
- Public surface: standalone page, no auth required
- JSON requests bypass branded page — default Laravel JSON error handling preserved

### Offline Overlay

- `OfflineOverlay` component lives in `AuthenticatedLayout` — active on all backend/POS pages
- Uses `navigator.onLine` + `window.addEventListener('offline'/'online')` — no backend involvement
- Bottom banner: amber styling, dismissable per session (dismissed state resets on reconnect)
- When connection restores, overlay auto-hides
- Public storefront offline handling deferred to Sprint 8 (storefront layout)

## 32. Legal Pages Rules (Item 1.17)

- Exactly two legal pages exist: Privacy Policy and Terms & Conditions
- Pages are seeded at migration time — no create or delete flow
- `is_visible = false` → public route returns HTTP 404 — same as non-existent page
- Admin can toggle visibility at any time — useful during content editing
- Content stored as raw HTML from @mantine/tiptap — rendered via dangerouslySetInnerHTML
  on public page (admin-only input, XSS risk acceptable)
- `updated_by` filled on every save (update + toggleVisibility) — audit trail preserved
- Public routes (`/privacy-policy`, `/terms-conditions`) require no authentication
- Footer links on public Legal/Show.tsx always render — link to the other page
- @tailwindcss/typography required for `prose` classes on Legal/Show.tsx
