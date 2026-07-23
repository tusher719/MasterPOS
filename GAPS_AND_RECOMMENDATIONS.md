# Gaps & Recommendations — Master Business Suite

> Paste this file together with the other 6 documentation files
> (MASTER_CONTEXT.md, PROJECT_RULES.md, DATABASE_SCHEMA.md, CHANGELOG.md,
> BUSINESS_RULES.md, ARCHITECTURE.md) at the start of any new chat about
> fixing these gaps or building the Partnership features below.
> This file is planning/reference only — nothing described here is implemented yet.

## AI Usage Notes

- Read this file AFTER reading the other 6 documentation files, since it references
  tables, controllers, and rules defined there.
- This file lists confirmed gaps in the current system AND new business rules that
  are not yet built. Treat "Priority: Must Fix" items as the next real work, not
  just discussion points.
- Follow PROJECT_RULES.md Rule 1 ("STEP BY STEP ONLY") — implement ONE item from
  Section 5 (Priority Summary) at a time, in the order listed in Section 6, unless
  the user explicitly asks for a different order.
- After any item from this file is implemented, update the following in the other
  documentation files:
    - `MASTER_CONTEXT.md` → move the completed item out of pending work, update
      "Current Status"
    - `CHANGELOG.md` → add a new version entry following the existing format
    - `DATABASE_SCHEMA.md` → add any new tables/columns
    - `BUSINESS_RULES.md` → add the new rule permanently once implemented
    - This file (`GAPS_AND_RECOMMENDATIONS.md`) → mark the item as Done instead
      of deleting it, so the history of what was fixed is preserved
- Do not implement any "Nice to Have" item unless the user explicitly asks for it.
- **Standing rule — keep the Investment/Investor Show page complete:** any time a
  new investor/partner-related feature is built (capital withdrawal, principal
  lock/unlock, profit payment, cost return, deferred/reinvested amounts, etc.),
  check whether that data point is visible on the Investment Show page
  (`Backend/Investments/Show.tsx`) and the Partner Show page. If it isn't, add it.
  This page must always be a single, complete, up-to-date financial picture of
  that investor/partner — never a place the user has to leave to piece together
  the full picture. See Gap 1.5 for the current baseline gap.

---

## 0. Root Cause — In One Sentence

The system is currently in a transition between two architectures:

- **Old model (Investor-centric):** `Investment` represented both Capital and Profit
  in one entity.
- **New model (Partner-centric):** `Investment` = Capital only, `Partner` = Profit
  entity (separate).

Both models currently coexist (`profit_distributions.source_type`:
`investment_based` vs `partner_based`), and most of the confusion in the system
comes from this incomplete migration — naming, data, and features were not fully
carried over from the old model to the new one.

---

## 1. Confirmed Gaps — Investments / Profit Distribution / Investor Balance / Capital Ledger / Investor Statements

### Gap 1.1 — No denormalized Profit Balance for Working/Product Partners

**Where:** `investor_profit_balances.investment_id` is a UNIQUE, mandatory
reference. Partners with no Investment (working/product partners) never get a
balance record.

**Impact:** Per the Phase 4H changelog, when a partner-based distribution item is
settled and `investment_id` is null, the `InvestorProfitBalance` update is
skipped entirely (a guard was added specifically for this). As a result,
Working/Product Partners have no live "Pending Balance" anywhere in the dashboard.

**Priority:** Should Fix
**Status:** ✅ Done — built as part of Gap 4.2. Table exists with separate
cost_return and profit_share columns. PartnerProfitBalance model and
PartnerProfitBalanceService handle all credit/debit/reversal operations.

---

### Gap 1.2 — Investor Statement is stuck on the old architecture

**Where:** `InvestorStatementController` is built entirely around
`investment_id`-based queries (Phase 3, before the Partner domain existed).
Partner-based distribution items have `investment_id = null`.

**Impact:** No statement or PDF can be generated for a Working/Product Partner
from this page.

**Priority:** Should Fix
**Status:** ✅ Done
**Fix:** Update the controller query to look up distribution items by either
`investment_id` OR `partner_id`.

**Post-implementation note (Gap 1.2):**

- Two new routes added: `investor-statements/investment/{investment}` and
  `investor-statements/partner/{partner}` (+ pdf variants) — replaces old
  single `investor-statements/{investment}` route
- `InvestorStatementController` updated: `index()` now merges investment rows
    - partner rows (partners with no investment but ≥1 distribution item);
      `show()` and `pdf()` query distribution items by `investment_id OR partner_id`
      (when investment has a linked partner_id); new `showPartner()` and
      `pdfPartner()` methods added for partner-only statements
- New page: `InvestorStatements/PartnerShow.tsx` — partner statement with
  profit balance (cost return + profit share split), distribution history
  (profit share / cost return / total columns), PDF export
- New Blade: `pdf/partner-statement.blade.php` — partner PDF without capital
  section; cost return summary card shown only for product partners
- `investor-statement.blade.php` updated — capital section conditional
  (`@if total_deposited > 0`); capital transactions section conditional
- `investor-statement.d.ts` updated — `type` field added to
  `InvestorStatementSummary`; new `PartnerStatement`, `PartnerStatementInfo`,
  `PartnerProfitBalanceSummary`, `PartnerStatementDistributionItem` interfaces
- `Partner` model: `distributionItems()` HasMany relation added
- **Important workflow note:** For partners who have both an investment AND
  partner_based distributions, the investment record must have `partner_id` set
  correctly — otherwise partner_based items won't appear in the investment
  statement. Set via: `Investment::find($id)->forceFill(['partner_id' => $partnerId])->save()`

---

### Gap 1.3 — Two data models mixed under one menu (UI confusion)

**Where:** The "Profit Distributions" menu shows both `investment_based` and
`partner_based` distributions together, but they behave differently
(Invested column and Eligibility Panel are conditionally shown/hidden).

**Impact:** Users get confused about why one distribution looks different from
another in the same list.

**Priority:** Nice to Have
**Status:** ✅ Done
**Fix:** Add a visual badge/filter on the distribution list based on
`source_type` (Legacy vs Partner-based).

**Post-implementation note (Gap 1.3):**

- `DistributionSourceType` type alias added to `profit-distribution.d.ts`
- `Distribution.source_type` field added to `Distribution` interface
- `ProfitDistributionController::index()`: `source_type` filter query added;
  `source_type` included in `filters` prop passed to Inertia
- `Index.tsx`: `sourceType` state + button group UI (All Types / Legacy /
  Partner-based); active button styled per type — gray for Legacy,
  indigo for Partner-based; `hasActiveFilter` updated to include `sourceType`;
  `resetFilters()` clears `sourceType`
- `ProfitDistributionTable.tsx`: `SourceTypeBadge` component added —
  Legacy: `gray-100/500`, Partner-based: `indigo-100/700`;
  "Type" column added after "Title" column
- No migration required — `source_type` column exists since Phase 4H

---

### Gap 1.4 — Capital and Profit data scattered across two places

**Where:** A Partner's capital-side data lives under the "Investments" nav group;
profit-side data lives under the "Partners" nav group. There is no single place
to see a partner's full financial picture.

**Priority:** Nice to Have
**Fix:** Add a "Financial Overview" section to the Partner Show page that
combines Capital + Profit summaries (pull from existing services — no new table
required).

---

### Gap 1.5 — Investment Show page has no financial summary (currently static info only)

**Where:** `Backend/Investments/Show.tsx` (Investment Details page) currently
displays only static fields: Title, Investor Name, Investment Type, Amount,
Investment Date, Status, Transaction Reference, Note, and Attachment. It shows
none of the live financial activity tied to that investment.

**Impact:** To answer a simple question like "how much has this investor
deposited, how much have they withdrawn, how much profit have they earned and
been paid, how much principal is still locked" — the admin currently has to
check four separate pages (Capital Ledger, Investor Balances, Profit
Distributions, Investor Statements) and piece it together manually. There is no
single place that shows the complete picture for one investor/investment.

**Priority:** Must Fix
**Fix:** Add a "Financial Summary" section to the Investment Show page (and the
equivalent Partner Show page for partner-based partners) that displays, pulled
live from existing tables/services:

| Field                                                         | Source                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Total Deposited (principal, this investment)                  | `investor_capital_balances.total_deposited`                                     |
| Total Withdrawn (principal)                                   | `investor_capital_balances.total_withdrawn`                                     |
| Unlocked Principal / Locked Principal                         | See Gap 4.1 — new computed fields                                               |
| Total Profit Earned                                           | `investor_profit_balances.total_earned` (or `partner_profit_balances`, Gap 1.1) |
| Total Profit Paid                                             | `investor_profit_balances.total_paid`                                           |
| Total Profit Deferred / Reinvested                            | `investor_profit_balances.total_deferred` / `total_reinvested`                  |
| Pending Profit Balance                                        | `investor_profit_balances.pending_balance`                                      |
| Recent Capital Ledger entries (deposit/withdrawal/adjustment) | `capital_ledger_entries`                                                        |
| Recent Distribution payment history                           | `profit_distribution_items`                                                     |

This section should make it clear, at a glance, whether the investor got their
money by investing capital vs. by working/contributing product (see Section 4),
and exactly how much of each (principal vs. profit) they have taken so far.

---

## 2. Confirmed Gaps — Partners Module

### Gap 2.1 — No validation between Partner Type and Profit Rule

**Where:** There is no enforced match between `partner_profit_rules.profit_source`
(`capital_share`/`working_share`/`product_share`) and the partner's
`partner_type_*` flags.

**Impact:** It's currently possible to create a `product_share` rule for a
working-type partner by mistake — a silent data error that produces wrong or
zero amounts in calculations, and is hard to trace back.

**Priority:** Must Fix
**Fix:** Add validation in the rule create/update flow that checks the partner's
type before saving.

---

### Gap 2.2 — Settlement Config requires approval per the rules, but has no approval column

**Where:** BUSINESS_RULES.md states Settlement Config changes require Super Admin
approval, but the `partner_settlement_configs` table has no `approved_by` /
`approved_at` columns.

**Impact:** Anyone can change the Settlement Type (e.g. `cost_plus_profit` →
`profit_only`) and it takes effect immediately, with no approval gate — a real
financial risk.

**Priority:** Must Fix
**Fix:** Add `approved_by`/`approved_at` (nullable, excluded from `$fillable`)
and an `approve()` action, following the same pattern already used for
`partner_profit_rules`.

**Post-implementation note (Gap 2.2):**

- approved_by/approved_at added to partner_settlement_configs
- Existing records auto-approved via migration (Super Admin id=1)
- Approved configs: edit/delete blocked — pending configs only
- settlement_config.approve permission → Admin role only
- Deferred status removed from period lock logic in PartnerPeriodResolutionService:
  deferred = unpaid, period stays open for next distribution.
  Only paid/reinvested statuses lock a period going forward.

---

### Gap 2.3 — Mixed Partners can only have one Settlement Type / one Eligibility record

**Where:** A partner who is both Capital + Product type can only have one active
settlement config and one active eligibility record at a time — there's no way
to split these per type.

**Impact:** For a Mixed Partner, you cannot pause one income stream (e.g. capital
profit) while keeping another (e.g. product profit) active.

**Priority:** Nice to Have (becomes Should Fix if Mixed Partners are actually
used in the business)
**Fix:** Add an `applies_to` column (`capital`/`working`/`product`) to
`partner_settlement_configs` and `partner_profit_eligibilities`.

---

### Gap 2.4 — Mixed Rule resolution logic is ambiguous

**Where:** BUSINESS_RULES.md says the "most recent matching rule" (singular) is
used at resolution time, but `MixedStrategy` is conceptually meant to sum
multiple sub-strategies. These two statements contradict each other.

**Priority:** Should Fix (must be resolved before the calculation engine
behavior is finalized)
**Fix:** Document explicitly: a partner CAN have multiple active rules
(different `rule_type` each) at the same time; `MixedStrategy` sums the results
of all applicable rules.
**Status:** ✅ Done

**Post-implementation note (Gap 2.4):**

- No code or migration changes required — documentation only.
- BUSINESS_RULES.md Section 3 updated: "Rule Resolution at Calculation Time"
  now explicitly separates two cases:
    - Same rule_type → most recent matching rule (versioning case)
    - Different rule_type → all applicable rules summed (MixedStrategy case)
- A partner cannot have two active rules of the same rule_type simultaneously.
- MixedStrategy sums results from ALL applicable rules independently —
  it does not pick a single "most recent" rule across different rule_types.
- Example documented: fixed_percent (25%) + product_based (65%) on same partner
  → Rule A result + Rule B result = total share_amount.

---

### Gap 2.5 — Unverified guard against deactivated/soft-deleted partners in distributions

**Where:** Business rules state a deactivated partner should receive no new
distributions, but there's no documented explicit check for `partner.is_active`
or soft-delete status inside the Calculation Engine.

**Priority:** Must Fix
**Fix:** Verify/add an explicit guard in `ProfitCalculationEngine`.

---

## 3. Naming Confusion — "Investor" vs "Partner"

Not a bug, but the single biggest source of day-to-day confusion:

| Current Name                                       | Problem                                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `InvestorProfitBalance`                            | Name implies Investor-only, but also has a `partner_id` column — unclear who it actually serves |
| `InvestorCapitalBalance`                           | Same issue                                                                                      |
| `InvestorStatementController`                      | Doesn't surface partner-based data (see Gap 1.2)                                                |
| `investor_name` column (profit_distribution_items) | Partner name is also stored in this same column for partner-based items                         |

**Priority:** Nice to Have (should be migrated gradually)
**Fix:** Avoid the word "Investor" in any new code going forward — use "Partner"
instead. Keep the old `Investor*` names clearly documented as
legacy/investment_based-only.

---

## 4. Partnership Business Rules — New Requirements (Finalized)

This section reflects decisions finalized in conversation with the business
owner. None of this is implemented yet.

### 4.1 — Capital Partner: Principal Lock with Partial Unlock

**Rule:**

- A Capital Partner can only withdraw their invested principal once total
  aggregate business sales since their investment date reach the invested amount.
  (No need to trace which specific product the money bought — aggregate sales
  are used.)
- **Partial unlock is supported** — the % of sales achieved unlocks the same %
  of the principal.

**Formula:**

```
Unlocked Amount = min(invested_amount, total_sales_since_investment_date)
Available to Withdraw = Unlocked Amount − principal already withdrawn
```

**Example:** Karim invests 100,000 BDT on Jan 1. Total sales since then reach
60,000 BDT.
→ Unlocked = 60,000 BDT (60%) → Karim can currently withdraw up to 60,000 BDT
of principal.

**Priority:** Must Fix (new core feature)
**Impact / Required Changes:**

- Add computed or stored fields to `investor_capital_balances`:
  `unlocked_amount`, `locked_amount`
- Add validation in `CapitalWithdrawalController`: block withdrawal requests
  exceeding the unlocked amount
- Show a clear error message: "You can currently withdraw up to X BDT — the
  rest is not yet unlocked."
- This calculation is per-investment (each investment tracked separately from
  its own investment date)

---

### 4.2 — Product Partner: Cost Return and Profit Share tracked separately

**Rule:**

- A Product Partner (who contributes goods instead of money) accrues both Cost
  Return and Profit Share as their assigned product sells — but the two are
  **tracked as separate ledger entries/balances**, so reports can clearly show
  "total cost returned to date" vs "total profit paid to date" independently.
- At withdrawal time, the partner can withdraw either combined or separately, as
  they prefer — no forced schedule.
- No separate "lock" mechanism is needed here (unlike the Capital Partner case),
  because unsold inventory never becomes a balance in the first place — the
  pending balance only ever reflects what has actually been sold.

**Example:** Rahim's product: 100 units (cost 500/unit, sale price 700/unit,
profit share 65%). After 20 units sell: Cost Return accrued = 20×500 = 10,000
BDT, Profit Share accrued = 20×(700−500)×65% = 2,600 BDT. Rahim can withdraw
these together (12,600 BDT) or separately.

**Priority:** Must Fix (new core feature)
**Impact / Required Changes:**

- In the `partner_profit_balances` table proposed in Gap 1.1, track cost return
  and profit share in separate columns (e.g. `total_cost_returned`,
  `total_profit_paid`)
- `ProductBasedStrategy` output must clearly separate these two amounts (verify
  whether it currently merges them into a single `share_amount`)
- Payment UI should show Cost Return balance and Profit Share balance
  separately, letting the partner choose any combination when requesting a
  withdrawal

**Post-implementation note (Gap 4.2):**

- partner_profit_balances table created (partner_id UNIQUE)
- profit_distribution_items.cost_return_amount column added (nullable dec10,2)
- PartnerProfitBalance model: creditCostReturn/creditProfitShare/recordPayment/reverseEarned
- PartnerProfitBalanceService: single authority for all partner balance operations
  — creditEarned() on approve, recordPayment() on markAsPaid/Deferred/Reinvested,
  reversePayment() on cancelPayment, reverseEarned() on distribution reverse
- ProductBasedStrategy: share_amount = total (cost+profit), profit_share_amount separate key
- ProfitDistributionController: cost_return_amount persisted in store/update,
  creditEarned called in approve for partner_based distributions
- PartnerBasedPreviewTable: Profit Share / Cost Return / Total Payable as separate columns
- Edit.tsx: date inputs migrated to AppDateInput/AppDateRangeInput
- Gap 1.1 resolved as part of this gap — no separate implementation needed

---

### 4.3 — Business Owner's own profit (residual) — no configuration needed

**Rule:**

- Whatever `profit_share_percent` is set on a Product Partner Assignment (e.g.
  65%), the remainder (35%) automatically belongs to the Business Owner — no
  separate configuration or table is needed for this.
- If tiered profit sharing (partner's % increases with higher sales volume) is
  needed in the future, that would be a separate Advanced feature — not needed
  now.

**Priority:** No implementation work needed right now — just document this
clearly so no one later assumes the owner's profit needs separate tracking.

---

### 4.4 — Same-Date Re-distribution: Duplicate Payment Prevention

**Rule:**

- If the admin creates a new Profit Distribution for a period that already has
  one (e.g. because a partner was missed the first time), the new distribution
  should show **all partners** (no one hidden — full visibility of the period).
- However, any partner whose item was already settled in a prior distribution
  for the same period must have their item automatically shown as
  **"Already Paid"** and locked — Pay button disabled — to prevent accidental
  double payment.
- Only new/previously-missed partners can be actively paid from the new
  distribution.
- "Settled" = payment_status IN ('paid', 'reinvested', 'deferred')
- "Same period" = overlap check: new.period_start <= existing.period_end AND new.period_end >= existing.period_start
- Applies to both investment_based and partner_based distributions
- UI label: "Already Paid (from Distribution #PD-2026-000001)"
- See Gap 4.5 below — this is extended into full per-partner period resolution,
  not just a simple lock/unlock flag. Implement 4.4 and 4.5 together.

**Priority:** Must Fix (financial safety issue)

---

### 4.5 — Per-Partner Effective Period Resolution (extends 4.4)

**Rule:** This is the finalized design for how 4.4 should actually work in
practice. When the admin selects one Period Start/End for a distribution and
clicks Calculate, the system does NOT apply that same period to every partner
equally. Instead, each partner gets their own **Effective Period**, computed
automatically — the admin never manually assigns or filters this per partner.

**Why:** Two things can each push a partner's real starting point later than
the admin's selected Period Start:

1. The partner's Profit Eligibility may start after the selected Period Start
   (see `partner_profit_eligibilities.profit_start_date`).
2. The partner may already have been paid for part of the selected range in a
   previous distribution (overlap, per Gap 4.4).

**Formula (per partner, per distribution):**

```
Effective Period Start = MAX(
    Selected Period Start,
    Partner's Eligibility Start Date,
    Partner's Last-Paid-Up-To Date + 1 day   (from any prior distribution)
)

Effective Period End = MIN(
    Selected Period End,
    Partner's Eligibility End Date (if set)
)
```

If `Effective Period Start > Effective Period End`, the partner is fully
ineligible for this distribution (same as today's "No active eligibility record
covering this period" case).

**Confirmed Decisions:**

- Overlap check: Option B — any overlap triggers check
- Settled statuses: paid, reinvested, deferred
- Scope: both investment_based and partner_based
- UI label: "Already Paid (from Distribution #PD-2026-000001)"

**Example (matches the real scenario tested by the business owner):**
Admin selects Period: Jul 5 → Aug 6.

- **Ruthy** — already paid Jul 1–31 in a prior distribution
  → Effective Period = **Aug 1 – Aug 6** (only the unpaid remainder)
- **Jamidul** — eligibility starts Jul 7
  → Effective Period = **Jul 7 – Aug 6**
- **Tusher** — no prior payment, eligibility covers the full range
  → Effective Period = **Jul 5 – Aug 6** (unchanged)

**UI Requirement:** Add an "Effective Period" column to the Partner Share
Breakdown table (see `Backend/ProfitDistributions/Create.tsx` and `Edit.tsx`),
shown per row, with a short note explaining why it was adjusted (e.g. "Jul 1–31
already paid via PD-2026-000001" or "Eligibility starts Jul 7"). The admin sees
the result — they do not pick it manually, and there is no tab/filter UI for
this; it is fully computed.

**Priority:** Must Fix (this is the real, finalized version of 4.4 — implement
them together, not separately)
**Impact / Required Changes:**

- `ProfitCalculationEngine` must compute Financial Summary (Revenue, COGS,
  Expenses) **per unique Effective Period**, not once for the whole selected
  range. Partners sharing the same Effective Period reuse the same computed
  summary (no duplicate work).
- `PartnerEligibilityService::isEligible()` extended/reused to supply the
  eligibility-start floor per partner (already exists — Gap 4.5 just consumes
  it earlier, at preview time, per partner, instead of as a pass/fail gate).
- A new `PartnerPeriodResolutionService` is needed to:
    1. Get each partner's eligibility start/end dates
    2. Get each partner's "last paid up to" date from prior distributions
       (approved/distributed status only, settled items only)
    3. Compute the Effective Period per partner
    4. Return grouping of partners by unique Effective Period (for engine reuse)
- This is a genuine architecture change to the calculation engine, not a small
  tweak — the engine currently calculates one Financial Summary per
  distribution; this requires it to calculate one per unique Effective Period.

---

## 5. Priority Summary

## 5. Priority Summary

| #         | Item                                                   | Priority     | Status                          | New Migration? |
| --------- | ------------------------------------------------------ | ------------ | ------------------------------- | -------------- |
| 4.4 + 4.5 | Duplicate Prevention + Per-Partner Effective Period    | Must Fix     | ✅ Done                         | No             |
| 2.2       | Settlement Config Approval Columns                     | Must Fix     | ✅ Done                         | Yes            |
| 2.1       | Partner Type ↔ Rule Validation                         | Must Fix     | ✅ Done                         | No             |
| 2.5       | Verify Deactivated Partner Guard                       | Must Fix     | ✅ Done (guard already existed) | No             |
| 4.1       | Capital Principal Lock + Partial Unlock                | Must Fix     | ✅ Done                         | Yes            |
| 4.2       | Product Partner Cost/Profit Split                      | Must Fix     | ✅ Done                         | Yes            |
| 1.5       | Investment/Investor Show Page — Full Financial Summary | Must Fix     | ✅ Done                         | No             |
| 1.1       | Partner Profit Balance table (working/product)         | Should Fix   | ✅ Done (built in Gap 4.2)      | Yes            |
| 1.2       | Investor Statement — Partner support                   | Should Fix   | ✅ Done                         | No             |
| 2.4       | Mixed Rule Resolution clarification                    | Should Fix   | ✅ Done                         | No (doc only)  |
| 1.3       | Distribution List UI Badge                             | Nice to Have | ✅ Done                         | No             |
| 1.4       | Partner Financial Overview page                        | Nice to Have | ✅ Done                         | No             |
| 2.3       | Mixed Partner per-type Settlement/Eligibility          | Nice to Have | ✅ Done                         | Yes            |
| 3         | Investor → Partner Naming Migration                    | Nice to Have | Pending                         | Gradual        |

---

## 6. Suggested Implementation Order

Per PROJECT_RULES.md Rule 1 ("STEP BY STEP ONLY"), nothing in this file should
be implemented all at once. Confirmed order for the "Must Fix" items:

1. **4.4 + 4.5** (Duplicate Prevention + Per-Partner Effective Period) — build
   together as one unit, since 4.5 is the finalized real-world version of how
   4.4 should behave. This is the biggest engine change but has the highest
   financial-safety payoff — do this first.
2. **2.2** (Settlement Config Approval) — small, independent migration
3. **2.1** (Partner Type ↔ Rule Validation) — small, independent, no migration
4. **2.5** (Deactivated Partner Guard) — verify first, only build if missing
5. **4.1** (Capital Principal Lock) — larger feature, core change to Capital domain
6. **4.2** (Product Partner Cost/Profit Split) — larger feature, core change to
   Profit domain
7. **1.5** (Investment Show Page — Full Financial Summary) — do this last among
   Must Fix items, since it depends on 4.1 and 4.2 being built first (locked/
   unlocked principal and separate cost/profit balances need to exist before
   they can be displayed)
8. Remaining "Should Fix" and "Nice to Have" items, in priority order

**Post-implementation notes (Gap 4.4 + 4.5):**

- Ineligible items (already paid partners, empty effective period) shown in preview
  for admin transparency but NEVER stored in profit_distribution_items.
- Filter in store()/update(): `is_eligible !== false AND share_amount > 0`
- Pre-flight check before transaction: if all partners are ineligible/already paid,
  return user-friendly error via `back()->withErrors(['items' => '...'])`.
- Edit page recalculate bug (source_type drift): use `distribution.source_type`
  (prop) instead of `form.source_type` (state) in handleRecalculate() axios params.
- Edit.tsx date input migration to AppDateInput/AppDateRangeInput: pending next session.
- Show.tsx tfoot: `invested_amount` column conditionally rendered for investment_based only.

**Post-implementation note (Gap 1.5):**

- InvestmentController::show() updated — loads capitalBalance (with lock recompute),
  profitBalance, recentCapitalEntries (last 5), recentProfitItems (last 5),
  partnerProfitBalance (if investment.partner_id exists)
- Investment Show page now shows: Capital Summary with lock progress bar,
  Profit Summary, Partner Profit Balance card (optional), Recent Capital
  Transactions table, Recent Profit Payments table
- PartnerController::show() updated — loads recentProfitItems (last 5, partner_id keyed)
- Partner Show page now shows: Profit Balance card (cost return + profit share split),
  Recent Profit Payments table
- Investment date picker migrated from Mantine DatePickerInput to AppDateInput
- No new migrations required — all data from existing tables
