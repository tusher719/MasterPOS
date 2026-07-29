# Gaps & Recommendations — Part A (Original POS-Era Gaps)

> All items in this file are ✅ Done — do not rebuild anything here.
> Paste this file when: working on Partner/Investment domain, debugging
> architecture decisions, or needing history of what was built and why.

---

## AI Usage Notes

- Read MASTER_CONTEXT + PROJECT_RULES + DATABASE_SCHEMA + BUSINESS_RULES +
  ARCHITECTURE before reading this file.
- Items marked ✅ Done are already implemented — do not rebuild them.
- Standing rule: any time a new investor/partner-related feature is built,
  check whether that data point is visible on the Investment Show page and
  the Partner Show page.

---

## 0. Root Cause — In One Sentence

The system was in a transition between two architectures:

- **Old model (Investor-centric):** Investment represented both Capital and Profit.
- **New model (Partner-centric):** Investment = Capital only, Partner = Profit entity.

Both models coexist (profit_distributions.source_type: investment_based vs partner_based).

---

## 1. Investments / Profit Distribution / Capital Ledger / Investor Statements

| Gap | Title                                                  | Priority     | Status                     |
| --- | ------------------------------------------------------ | ------------ | -------------------------- |
| 1.1 | Partner Profit Balance table (working/product)         | Should Fix   | ✅ Done (built in Gap 4.2) |
| 1.2 | Investor Statement — Partner support                   | Should Fix   | ✅ Done                    |
| 1.3 | Distribution List UI Badge (source type)               | Nice to Have | ✅ Done                    |
| 1.4 | Partner Financial Overview page                        | Nice to Have | ✅ Done                    |
| 1.5 | Investment/Investor Show Page — Full Financial Summary | Must Fix     | ✅ Done                    |

### Gap 1.2 — Post-implementation notes

- Two new routes: investor-statements/investment/{investment} and investor-statements/partner/{partner}
- InvestorStatementController updated: index() merges investment rows + partner rows
- New page: InvestorStatements/PartnerShow.tsx
- New Blade: pdf/partner-statement.blade.php
- investor-statement.blade.php: capital section conditional (@if total_deposited > 0)
- Partner model: distributionItems() HasMany relation added
- Important: investments.partner_id must be set for OR query to work

### Gap 1.5 — Post-implementation notes

- InvestmentController::show() loads capitalBalance, profitBalance, recentCapitalEntries (last 5), recentProfitItems (last 5), partnerProfitBalance
- Investment Show page: Capital Summary, Principal Lock Status, Profit Summary, Partner Profit Balance card, Recent Capital Transactions, Recent Profit Payments
- PartnerController::show() loads recentProfitItems (last 5)
- Partner Show page: Profit Balance card (cost return + profit share split), Recent Profit Payments

---

## 2. Partners Module

| Gap | Title                                         | Priority     | Status                          |
| --- | --------------------------------------------- | ------------ | ------------------------------- |
| 2.1 | Partner Type ↔ Rule Validation                | Must Fix     | ✅ Done                         |
| 2.2 | Settlement Config Approval Columns            | Must Fix     | ✅ Done                         |
| 2.3 | Mixed Partner per-type Settlement/Eligibility | Nice to Have | ✅ Done                         |
| 2.4 | Mixed Rule Resolution clarification           | Should Fix   | ✅ Done (doc only)              |
| 2.5 | Verify Deactivated Partner Guard              | Must Fix     | ✅ Done (guard already existed) |

### Gap 2.2 — Post-implementation notes

- approved_by/approved_at added to partner_settlement_configs
- Existing records auto-approved via migration (Super Admin id=1)
- Approved configs: edit/delete blocked
- settlement_config.approve permission → Admin role only
- Deferred status removed from period lock logic — deferred = unpaid, period stays open

### Gap 2.3 — Post-implementation notes

- applies_to enum(capital/working/product/all) added to partner_settlement_configs and partner_profit_eligibilities
- Mixed Partner can have multiple active settlement configs simultaneously — one per stream
- Mixed Partner can have multiple active eligibility records simultaneously
- Option A resolution: specific stream config always wins over 'all' fallback
- applies_to carried forward on resume

### Gap 2.4 — Post-implementation notes (doc only)

- Same rule_type → most recent matching rule (versioning)
- Different rule_type → all applicable rules summed (MixedStrategy)
- A partner cannot have two active rules of the same rule_type simultaneously

---

## 3. Naming Confusion — "Investor" vs "Partner"

**Status:** ✅ Partially Done — safe changes applied, full rename deferred post-testing.

**What was done:**

- payee_name accessor added to ProfitDistributionItem
- PROJECT_RULES.md Rule 20 documents all legacy names

**What was NOT done (deferred — post Step 20 Testing):**

- investor_profit_balances table rename — blocked by naming conflict with partner_profit_balances
- investor_capital_balances table rename
- investor_name column rename to payee_name
- InvestorCapitalBalance / InvestorProfitBalance model rename

**Two-balance-model pattern (permanent):**

- investment_based partner → InvestorProfitBalance (investor_profit_balances, has investment_id)
- partner_based partner (no investment) → PartnerProfitBalance (partner_profit_balances, partner_id only)

---

## 4. Partnership Business Rules

| Gap       | Title                                               | Priority | Status                   |
| --------- | --------------------------------------------------- | -------- | ------------------------ |
| 4.1       | Capital Principal Lock + Partial Unlock             | Must Fix | ✅ Done                  |
| 4.2       | Product Partner Cost/Profit Split                   | Must Fix | ✅ Done                  |
| 4.3       | Business Owner residual profit                      | Doc only | ✅ Done (no code needed) |
| 4.4 + 4.5 | Duplicate Prevention + Per-Partner Effective Period | Must Fix | ✅ Done                  |

### Key Formulas Implemented

**Capital Lock:**

```
unlocked_amount = MIN(total_deposited, total_sales_since_investment_date)
locked_amount = total_deposited − unlocked_amount
available_to_withdraw = unlocked_amount − total_withdrawn
```

**Effective Period per partner:**

```
Effective Start = MAX(selected_start, eligibility_start, last_paid_up_to + 1 day)
Effective End   = MIN(selected_end, eligibility_end)
If Effective Start > Effective End → partner fully ineligible
```

**Settled statuses for overlap check:** paid, reinvested, deferred
**Overlap check:** any overlap between periods triggers the check

### Gap 4.1 — Post-implementation notes

- unlocked_amount + locked_amount added to investor_capital_balances
- computeAndSaveUnlockStatus() recomputed on: Capital Ledger Show load, withdrawal request, withdrawal approval
- canWithdraw() checks BOTH current_balance AND availableToWithdraw()
- Withdrawal guard must be BEFORE DB::transaction() in store()

### Gap 4.2 — Post-implementation notes

- partner_profit_balances table created (partner_id UNIQUE)
- profit_distribution_items.cost_return_amount column added
- PartnerProfitBalance model + PartnerProfitBalanceService
- share_amount = total (cost+profit), profit_share_amount separate key
- creditEarned() on approve, recordPayment() on markAsPaid/Deferred/Reinvested

### Gap 4.4 + 4.5 — Post-implementation notes

- Ineligible items shown in preview but NEVER stored in profit_distribution_items
- Filter in store()/update(): is_eligible !== false AND share_amount > 0
- Pre-flight check before transaction: if all partners ineligible → back()->withErrors()
- Edit page recalculate: use distribution.source_type (prop) not form.source_type (state)
- PartnerPeriodResolutionService: resolves effective period per partner
- Engine Financial Summary: computed ONCE per unique Effective Period group

---

## 5. Summary — All Original Items Done

Every item from the original POS-era gap list is ✅ Done as of CHANGELOG v2.22
(Gap 2.3, 2026-07-23). The system moved into "new feature mode" — see GAPS_PART_B_CORE
and GAPS_PART_B_LATER for the online-business expansion work.
