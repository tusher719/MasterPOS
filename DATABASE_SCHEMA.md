# Database Schema — Master Business Suite

> Single source of truth for all table structures.
> Updated through: Financial Architecture Redesign (Pre Phase 4)

---

## CRITICAL COLUMN NOTES (read before writing any query)

- `products.category_id` — NOT product_category_id
- `products.cost_price` — NOT purchase_price or buying_price
- `products.stock_qty` — NOT stock_quantity
- `products.low_stock_threshold` — NOT low_stock_alert
- `expenses` table has NO `status` column
- `hold_orders` has NO `deleted_at` (hard delete only)
- `profit_distribution_items` has NO `deleted_at` (cascade from parent)
- `investor_profit_balances.investment_id` is UNIQUE (one balance per investor)
- `partner_investments` is the link table — NOT a direct FK on investments
- `profit_distributions.source_type` determines which calculation engine to use
- Profit share percent comes from `partner_profit_rules.share_percent` — NEVER from investment amount
- Pending profit rules have `approved_by IS NULL` — excluded from all calculations
- `sale_status_histories.status` is varchar (not enum) — stores order_status
  string values; always written via SaleStatusHistory::create(), never raw query

---

## Step 02 — Auth & Users

### users

id, name, email(unique), phone(nullable), password, status(enum:active/inactive default:active),
avatar(nullable), email_verified_at(nullable), remember_token(nullable), timestamps, deleted_at

### login_histories

id, user_id(FK users restrict), ip_address(nullable), user_agent(nullable), logged_in_at, timestamps

### activity_logs

id, user_id(FK users nullable nullOnDelete), module, action, description,
subject_type(nullable), subject_id(bigint nullable), properties(json nullable), timestamps

- Relation: user() BelongsTo with withTrashed() — required

### Spatie Permission Tables

roles, permissions, model_has_roles, model_has_permissions, role_has_permissions

last_seen_at (timestamp nullable) — after remember_token

---

## Step 03 — Settings

### business_settings

id, key(unique), value(text nullable), timestamps

### payment_methods

id, name, is_active(bool default true), sort_order(int default 0), timestamps

### expense_categories

id, name, color(nullable), is_active(bool default true), timestamps

### investment_types

id, name, description(text nullable), is_active(bool default true), timestamps

### payment_methods additions (Item 5.1)

online_charge_type (enum: percent/fixed nullable)
online_charge_value (decimal 10,2 default 0)
charge_enabled (bool default false)
charge_label (varchar nullable)

### payment_method_banks

id, payment_method_id (FK payment_methods restrict),
bank_name (varchar), account_number (varchar nullable),
account_name (varchar nullable),
charge_type (enum: percent/fixed nullable),
charge_value (decimal 10,2 default 0),
charge_enabled (bool default false),
charge_label (varchar nullable),
is_active (bool default true),
sort_order (int default 0),
timestamps

### payment_methods additions (Item 5.2)

type enum extended: added `bank_transfer` value

### order_attempt_logs

id, ip_address (varchar 45), phone (varchar 20 nullable),
attempted_at (timestamp), was_blocked (bool default false), timestamps
Indexes: (ip_address, attempted_at), phone

### business_settings additions (Item 6.3)

fraud_ip_order_limit_per_24h (int default 3)
fraud_block_message (text)
fraud_contact_whatsapp (varchar nullable)
fraud_contact_phone (varchar nullable)
fraud_contact_facebook (varchar nullable)

### business_settings additions (Item 6.4)

fraud_success_ratio_threshold (int default 60)
fraud_min_orders_before_check (int default 3)

Note: fraud_block_message and contact fields shared with Layer 3 (6.4/6.5) —
seeded once here, not duplicated in later migrations.

---

## Step 04 — Products

### product_categories

id, name, parent_id(FK self nullable nullOnDelete), is_active(bool default true), timestamps, deleted_at

### units

id, name, abbreviation, is_active(bool default true), timestamps

### products

id, name, sku(unique), barcode(nullable), **category_id**(FK product_categories restrict),
unit_id(FK units restrict), **cost_price**(dec10,2), last_purchase_price(dec10,2 nullable),
average_cost(dec10,2 default 0), sale_price(dec10,2), is_taxable(bool default false),
tax_id(nullable), discount_type(nullable), discount_value(dec10,2 nullable),
**stock_qty**(dec10,2 default 0), **low_stock_threshold**(dec10,2 default 0),
min_sale_qty(dec10,2 default 1), has_variants(bool default false),
weight(dec10,3 nullable), weight_unit(nullable), is_featured(bool default false),
sort_order(int default 0), meta_title(nullable), meta_description(nullable),
description(text nullable), is_active(bool default true), timestamps, deleted_at

### product_variants

id, product_id (FK products cascade), sku (unique),
attributes (JSON — {"color":"Red","size":"XL"}),
stock_qty (decimal 10,2 default 0),
price_override (decimal 10,2 nullable),
cost_price_override (decimal 10,2 nullable),
image_id (bigint nullable — ref product_images),
is_active (bool default true),
timestamps
Indexes: product_id, is_active

### product_images

id, product_id(FK products cascade), image_path, is_primary(bool default false),
sort_order(int default 0), timestamps

---

## Step 05 — Notifications

### notifications

id(uuid PK), type, notifiable_type, notifiable_id, data(json), read_at(nullable), timestamps

---

## Step 06 — Suppliers

### suppliers

id, name, company(nullable), email(unique nullable), phone(nullable), address(text nullable),
city(nullable), country(varchar default 'Bangladesh'), opening_balance(dec10,2 default 0),
is_active(bool default true), timestamps, deleted_at

---

## Step 07 — Purchases & Inventory

### purchases

id, supplier_id(FK suppliers restrict), reference_no(unique), purchase_date(date),
purchase_status(enum: draft/ordered/received/partial_received/cancelled default:draft),
subtotal(dec10,2), discount(dec10,2 default 0), tax(dec10,2 default 0),
shipping_cost(dec10,2 default 0), grand_total(dec10,2),
paid_amount(dec10,2 default 0), due_amount(dec10,2),
payment_status(enum: paid/partial/due default:due),
note(text nullable), created_by(FK users restrict), updated_by(FK users nullable nullOnDelete),
timestamps, deleted_at

### purchase_items

id, purchase_id(FK purchases cascade), product_id(FK products restrict),
quantity(int unsigned), unit_cost(dec10,2), subtotal(dec10,2), timestamps

### purchase_payments

id, purchase_id(FK purchases cascade), payment_method_id(FK nullable nullOnDelete),
amount(dec10,2), payment_date(date), reference(varchar nullable), note(text nullable),
created_by(FK users restrict), timestamps

### stock_movements

id, product_id(FK products restrict), reference_type(varchar nullable),
reference_id(bigint nullable), type(enum: purchase/sale/return/adjustment/transfer),
quantity(int), before_quantity(int), after_quantity(int), unit_cost(dec10,2 nullable),
note(text nullable), created_by(FK users nullable nullOnDelete), timestamps
Indexes: (reference_type, reference_id), product_id, type

### products additions (Step 07 migration)

last_purchase_price(dec10,2 nullable), average_cost(dec10,2 default 0)

### stock_movements additions (Item 3.3 migration)

variant_id (FK product_variants nullable nullOnDelete)

### products additions (Item 3.4 migration)

slug (varchar unique — auto-generated: Str::slug(name) + 6 random chars, immutable after creation)

### stock_reservations

id, product_id(FK products restrict), variant_id(FK product_variants nullable nullOnDelete),
sale_id(FK sales nullable nullOnDelete — filled on conversion),
quantity(decimal 10,2), reserved_until(timestamp),
status(enum: active/converted/expired/released default:active),
timestamps
Indexes: (product_id, status), (variant_id, status), (status, reserved_until)

### business_settings additions (Item 3.5)

## stock_reservation_minutes (int default 30) — group: inventory

## Step 08 — Customers

### customers

id, name, email(unique nullable), phone(nullable), address(text nullable),
city(nullable), country(varchar default 'Bangladesh'), opening_balance(dec10,2 default 0),
is_active(bool default true), timestamps, deleted_at

Note: opening_balance = historical balance before using this POS only.
Positive = customer owes business. Negative = business owes customer.

### business_settings additions (Item 1.2)

logo_type (varchar default 'text' — enum: image/text/both)
logo_image_path (varchar nullable — canonical navbar image path)
logo_text_segments (text nullable — JSON array: [{text, color}], max 5 segments)

Note: logo_image_path is the canonical key for navbar rendering.
business_logo key kept for PDF backward compat (public_path() in Blade templates).
logo_type='both' renders image + text side by side in navbar.

### business_settings additions (Item 1.16)

maintenance_mode_enabled (bool stored as string 'true'/'false' default 'false')
maintenance_message (text — shown on maintenance page)
coming_soon_mode_enabled (bool stored as string 'true'/'false' default 'false')
coming_soon_message (text — shown on coming soon page)

### legal_pages (Item 1.17 — new table)

id, type (enum: privacy_policy/terms_conditions UNIQUE),
title (varchar), content (longText nullable),
is_visible (bool default false),
updated_by (FK users nullable nullOnDelete),
timestamps

Note: Exactly two rows — seeded at migration time (privacy_policy + terms_conditions).
Note: No create/delete flow — only update (title/content/is_visible) and toggleVisibility.
Note: is_visible = false → public route returns 404; admin can toggle at any time.
Note: content stored as raw HTML from @mantine/tiptap RichTextEditor.

---

---

## Step 09 — Sales

### sales

id, reference_no(unique), customer_id(FK nullable nullOnDelete), sale_date(date),
subtotal(dec10,2), discount(dec10,2 default 0), tax(dec10,2 default 0),
grand_total(dec10,2), paid_amount(dec10,2 default 0), due_amount(dec10,2),
payment_status(enum: paid/partial/due default:due),
payment_method_id(FK nullable nullOnDelete), note(text nullable),
created_by(FK users restrict), timestamps, deleted_at
Reference format: SL-YYYYMMDD-XXXX

### sale_items

id,
sale_id(FK sales cascade),
product_id(FK products restrict),
variant_id (FK product_variants nullable nullOnDelete),
quantity(int unsigned),
unit_price(dec10,2),
discount(dec10,2 default 0),
subtotal(dec10,2),
timestamps

### sales additions (Item 4.1 migration)

order_status (enum: processing/confirmed/out_for_delivery/delivered/cancelled/returned default: processing)
payment_type (enum: full_paid/half_paid/cash_on_delivery nullable)

### sales additions (Item 4.2 migration)

delivery_type (enum: store_pickup/inside_dhaka/outside_dhaka/parallel nullable)
delivery_charge (decimal 10,2 nullable default 0)
delivery_charge_free (bool default false)
delivery_address (text nullable)
delivery_contact_phone (varchar nullable)
delivery_status (enum: pending/dispatched/delivered/failed nullable)

### sales additions (Item 4.6 migration)

courier_provider (varchar nullable)
courier_tracking_id (varchar nullable)
courier_status (enum: pending/picked_up/in_transit/delivered/returned/walk_in nullable)
courier_note (varchar nullable)

### sale_payments

id, sale_id (FK sales cascade),
payment_method_id (FK payment_methods nullable nullOnDelete),
payment_method_bank_id (FK payment_method_banks nullable nullOnDelete),
amount (decimal 10,2),
payment_charge (decimal 10,2 default 0),
payment_date (date),
reference (varchar nullable),
note (text nullable),
payment_proof_image (varchar nullable),
payment_status_manual (enum: pending_verification/verified/rejected default: verified),
transaction_id (varchar nullable),
verified_by (FK users nullable nullOnDelete),
verified_at (timestamp nullable),
created_by (FK users restrict),
timestamps
Indexes: sale_id, payment_date, payment_status_manual

Note: POS payments created with payment_status_manual = 'verified' immediately.
Note: Storefront manual payments created with payment_status_manual = 'pending_verification'.
Note: sales.paid_amount is always derived from SUM(sale_payments WHERE payment_status_manual = 'verified').
Note: recalculatePaymentStatus() on Sale model is the single authority for syncing paid_amount/due_amount/payment_status.

### sale_status_histories

id, sale_id (FK sales cascade),
status (varchar),
note (text nullable),
changed_by (FK users nullable nullOnDelete),
timestamps
Index: sale_id
Note: Append-only audit table — never update or delete rows.
Note: status is varchar (not enum) — stores order_status string values.

---

### Enum Reference additions (Item 4.2)

| Table | Column          | Values                                              |
| ----- | --------------- | --------------------------------------------------- |
| sales | delivery_type   | store_pickup, inside_dhaka, outside_dhaka, parallel |
| sales | delivery_status | pending, dispatched, delivered, failed              |

---

## Step 11 — Hold Orders (NO soft delete)

### hold_orders

id, reference_no(unique), customer_id(FK nullable nullOnDelete), note(text nullable),
status(enum: active/processing default:active), subtotal(dec10,2 default 0),
discount(dec10,2 default 0), tax(dec10,2 default 0), grand_total(dec10,2 default 0),
expires_at(timestamp nullable), created_by(FK users restrict), timestamps
**NO deleted_at — hard delete only**
Reference format: HO-YYYYMMDD-XXXX

### hold_order_items

id, hold_order_id(FK hold_orders cascade), product_id(FK products restrict),
quantity(int unsigned), unit_price(dec10,2), discount(dec10,2 default 0),
subtotal(dec10,2), timestamps

---

## Step 12 — Expenses

### expenses

id, expense_category_id(FK restrict), payment_method_id(FK nullable nullOnDelete),
title, amount(dec10,2), expense_date(date), reference(varchar nullable),
attachment(varchar nullable), note(text nullable),
created_by(FK users restrict), updated_by(FK users nullable nullOnDelete),
timestamps, deleted_at
**NO status column — no approval workflow**

---

## Step 13 — Investments

### investments

id, investment_type_id(FK restrict), title(varchar), investor_name(varchar),
amount(dec10,2), investment_date(date), reference(varchar nullable),
attachment(varchar nullable), note(text nullable),
status(enum: active/withdrawn default:active),
partner_id(FK partners nullable nullOnDelete), ← **Added in Phase 4H**
created_by(FK users restrict), updated_by(FK users nullable nullOnDelete),
timestamps, deleted_at
Attachment path: storage/app/public/investments/
Accepted types: jpg, jpeg, png, gif, webp, pdf, doc, docx, xlsx (max 5MB)

Note: investment.amount tracks capital only — it NEVER determines profit share.

---

## Step 14 — Profit Distribution

### profit_distributions

id, distribution_no(varchar unique), title(varchar), distribution_date(date),
period_start(date), period_end(date),
total_revenue(dec10,2 default 0), total_cogs(dec10,2 default 0),
total_expenses(dec10,2 default 0), total_investment(dec10,2 default 0),
gross_profit(dec10,2 default 0), net_profit(dec10,2 default 0),
distribution_percent(dec5,2 default 100), distributable_amount(dec10,2 default 0),
source_type(enum: investment_based/partner_based default: investment_based), ← **Added in Phase 4H**
status(enum: draft/approved/distributed default:draft), is_locked(bool default false),
note(text nullable),
approved_by(FK users nullable nullOnDelete), approved_at(timestamp nullable),
distributed_by(FK users nullable nullOnDelete), distributed_at(timestamp nullable),
created_by(FK users restrict), updated_by(FK users nullable nullOnDelete),
timestamps, deleted_at
Distribution No format: PD-YYYY-000001

Fields excluded from $fillable (set only via model methods):
status, is_locked, approved_by, approved_at, distributed_by, distributed_at

### profit_distribution_items

id, profit_distribution_id(FK cascade), investment_id(FK restrict nullable), ← nullable in Phase 4H
investor_name(varchar), investment_title(varchar), investment_type(varchar) — snapshots,
invested_amount(dec10,2), share_percent(dec8,4),
share_amount(dec10,2),
cost_return_amount(dec10,2 nullable default 0), ← **Added in Gap 4.2**
distribution_percent(dec5,2 default 100),
deferred_amount(dec10,2 default 0),
reinvested_amount(dec10,2 default 0),
carried_from_distribution_id(FK nullable nullOnDelete),
partner_id(FK partners nullable nullOnDelete), ← **Added in Phase 4H**
profit_rule_id(FK partner_profit_rules nullable nullOnDelete), ← **Added in Phase 4H**
profit_rule_snapshot(json nullable), ← **Added in Phase 4H** — frozen rule copy
settlement_type(enum: profit_only/cost_plus_profit/custom nullable), ← **Added in Phase 4H**
payment_status(enum: pending/partial/paid/deferred/reinvested/cancelled/reopened default:pending),
payment_method(varchar nullable), transaction_reference(varchar nullable) — legacy inline fields,
paid_by(FK users nullable nullOnDelete), paid_at(timestamp nullable),
note(text nullable), timestamps
**NO deleted_at — cascadeOnDelete from parent**

Fields excluded from $fillable (set only via model methods):
payment_status, payment_method, transaction_reference, paid_by, paid_at

Phase 4F Migration Notes:

- investment_id: nullable (partner-based items have no investment_id)
- invested_amount: nullable (partner-based items have no invested_amount)
- partner_id: FK partners nullable — added Phase 4F
- profit_rule_id: FK partner_profit_rules nullable — added Phase 4F
- profit_rule_snapshot: json nullable — added Phase 4F
- settlement_type: enum nullable — added Phase 4F

---

## Step 17 Phase 1 — Advanced Profit Distribution

### profit_distribution_eligibilities

id, profit_distribution_id(FK profit_distributions cascade),
investment_id(FK investments restrict), investor_name(varchar),
is_eligible(bool default true), eligibility_reason(varchar nullable),
override_by(FK users nullable nullOnDelete), override_at(timestamp nullable),
timestamps
UNIQUE constraint: (profit_distribution_id, investment_id)
Indexes: profit_distribution_id, investment_id

### profit_distribution_item_payments

id, profit_distribution_item_id(FK profit_distribution_items cascade),
amount(dec10,2),
payment_status(enum: pending/partial/paid/deferred/reinvested/cancelled/reopened default:pending),
payment_method(varchar nullable), transaction_reference(varchar nullable),
note(text nullable), paid_by(FK users nullable nullOnDelete), paid_at(timestamp nullable),
timestamps
Indexes: profit_distribution_item_id, payment_status

### investor_profit_balances

id, investment_id(FK investments restrict UNIQUE), investor_name(varchar),
partner_id(FK partners nullable nullOnDelete), ← **Added in Phase 4H**
total_earned(dec10,2 default 0), total_paid(dec10,2 default 0),
total_deferred(dec10,2 default 0), total_reinvested(dec10,2 default 0),
pending_balance(dec10,2 default 0), timestamps

---

## Step 17 Phase 2 — Capital Ledger

### capital_ledger_entries

id, investment_id(FK investments restrict), investor_name(varchar snapshot),
partner_id(FK partners nullable nullOnDelete), ← **Added in Phase 4H**
transaction_type(enum: deposit/withdrawal/reinvestment/adjustment),
direction(enum: credit/debit), amount(dec10,2), running_balance(dec10,2),
reference_no(varchar unique nullable CL-YYYYMMDD-XXXX),
source_type(varchar nullable), source_id(bigint nullable),
reason(text nullable mandatory for adjustment), note(text nullable),
status(enum: completed/pending/approved/rejected/cancelled default:completed),
requested_by(FK users nullable nullOnDelete),
approved_by(FK users nullable nullOnDelete), approved_at(timestamp nullable),
created_by(FK users restrict), timestamps
Indexes: (investment_id, transaction_type), (source_type, source_id), status

### investor_capital_balances

id, investment_id(FK investments restrict UNIQUE),
investor_name(varchar denormalized),
partner_id(FK partners nullable nullOnDelete), ← **Added in Phase 4H**
total_deposited(dec10,2 default 0), total_withdrawn(dec10,2 default 0),
total_reinvested(dec10,2 default 0), total_adjusted(dec10,2 default 0),
current_balance(dec10,2 default 0),
unlocked_amount(dec10,2 default 0), ← **Added in Gap 4.1**
locked_amount(dec10,2 default 0), ← **Added in Gap 4.1**
timestamps

---

## Step 17 Phase 4 — Partner Domain (NEW)

### partners

id, name(varchar), code(varchar unique nullable — PTR-001 format),
partner_type_capital(bool default false),
partner_type_working(bool default false),
partner_type_product(bool default false),
phone(varchar nullable), email(varchar nullable), address(text nullable),
user_id(FK users nullable nullOnDelete — optional system user link),
note(text nullable),
is_active(bool default true),
created_by(FK users restrict), updated_by(FK users nullable nullOnDelete),
timestamps, deleted_at

Note: partner*type*\* are boolean flags — multiple types can be true simultaneously.

### partner_investments

id, partner_id(FK partners restrict), investment_id(FK investments restrict),
is_primary(bool default true — which investment is primary capital source),
note(text nullable), timestamps
UNIQUE constraint: (partner_id, investment_id)
Indexes: partner_id, investment_id

### partner_profit_rules

id, partner_id(FK partners restrict),
rule_type(enum: fixed_percent/product_based/capital_based/mixed),
profit_source(enum: capital_share/working_share/product_share/custom),
share_percent(dec8,4 — manually configured, NEVER derived from capital amount),
effective_from(date), effective_to(date nullable — null = currently active),
is_active(bool default true),
reason(varchar nullable — why this rule exists or changed),
approved_by(FK users nullable nullOnDelete — null = pending approval),
approved_at(timestamp nullable),
created_by(FK users restrict), timestamps

Note: approved_by/approved_at excluded from $fillable — use forceFill()->save() in approval action.
Note: effective_to is set when a rule is superseded — old rules are NEVER deleted.

### partner_profit_balances

id, partner_id (FK partners restrict UNIQUE),
total_cost_returned (dec10,2 default 0),
total_cost_paid (dec10,2 default 0),
pending_cost_balance (dec10,2 default 0),
total_profit_earned (dec10,2 default 0),
total_profit_paid (dec10,2 default 0),
pending_profit_balance (dec10,2 default 0),
timestamps

Note: Cost return tracking for product partners only — 0 for capital/working partners.
Note: Created on first distribution approval via PartnerProfitBalance::findOrCreateForPartner().
Note: Separate from investor_profit_balances (which requires investment_id UNIQUE).

### partner_profit_rule_history

id, partner_profit_rule_id(FK partner_profit_rules restrict),
changed_by(FK users restrict),
change_type(enum: created/updated/approved/deactivated),
previous_value(json nullable), new_value(json),
change_reason(text), timestamps

Note: Append-only table — no updates, no deletes ever.

### partner_profit_eligibilities

id, partner_id(FK partners restrict),
profit_start_date(date),
profit_end_date(date nullable — null = ongoing),
applies_to(enum: capital/working/product/all default:all),
status(enum: active/paused/ended default: active),
pause_reason(text nullable),
paused_by(FK users nullable nullOnDelete), paused_at(timestamp nullable),
resumed_by(FK users nullable nullOnDelete), resumed_at(timestamp nullable),
created_by(FK users restrict), timestamps

Note: Eligibility is completely independent of capital/investment status.
Note: Resume creates a new active record — old paused record is never mutated back to active.
Note: scopeCoveringPeriod() is the authoritative query used by PartnerEligibilityService::isEligible().

### partner_product_assignments

id, partner_id(FK partners restrict),
assignable_type(varchar — 'product', future: 'category'/'brand'/'warehouse'),
assignable_id(bigint),
effective_from(date), effective_to(date nullable),
cost_return_enabled(bool default true — partner gets cost back per sale),
profit_share_percent(dec8,4 — partner's share of product profit),
is_active(bool default true),
approved_by(FK users nullable nullOnDelete — null = pending),
approved_at(timestamp nullable),
created_by(FK users restrict), timestamps
Indexes: (assignable_type, assignable_id), (partner_id, effective_from)

Note: Polymorphic assignable_type/id allows future expansion without schema changes.
Note: approved_by/approved_at excluded from $fillable — use forceFill()->save().

### partner_settlement_configs

id, partner_id(FK partners restrict),
settlement_type(enum: profit_only/cost_plus_profit/custom),
payment_preference(enum: cash/bank_transfer/adjustment/reinvestment),
auto_cost_return(bool default false — auto-calculate cost return for product partners),
notes(text nullable),
applies_to(enum: capital/working/product/all default:all),
is_active(bool default true),
approved_by(FK users nullable nullOnDelete),
approved_at(timestamp nullable),
created_by(FK users restrict), timestamps

Note: approved_by/approved_at excluded from $fillable — use approve() method with forceFill()->save().
Note: Pending configs (approved_by IS NULL) should not be used in settlement calculations.

### investment_fund_usages

id, capital_ledger_entry_id(FK capital_ledger_entries restrict),
partner_id(FK partners nullable nullOnDelete),
usable_type(varchar — 'purchase' | 'expense'),
usable_id(bigint),
amount(dec10,2),
note(text nullable),
created_by(FK users restrict), timestamps
Indexes: (usable_type, usable_id), capital_ledger_entry_id

---

## Enum Reference

| Table                             | Column                | Values                                                            |
| --------------------------------- | --------------------- | ----------------------------------------------------------------- |
| users                             | status                | active, inactive                                                  |
| purchases                         | purchase_status       | draft, ordered, received, partial_received, cancelled             |
| purchases                         | payment_status        | paid, partial, due                                                |
| sales                             | payment_status        | paid, partial, due                                                |
| hold_orders                       | status                | active, processing                                                |
| investments                       | status                | active, withdrawn                                                 |
| profit_distributions              | status                | draft, approved, distributed                                      |
| profit_distributions              | source_type           | investment_based, partner_based                                   |
| profit_distribution_items         | payment_status        | pending, partial, paid, deferred, reinvested, cancelled, reopened |
| profit_distribution_items         | settlement_type       | profit_only, cost_plus_profit, custom                             |
| profit_distribution_item_payments | payment_status        | pending, partial, paid, deferred, reinvested, cancelled, reopened |
| stock_movements                   | type                  | purchase, sale, return, adjustment, transfer                      |
| capital_ledger_entries            | transaction_type      | deposit, withdrawal, reinvestment, adjustment                     |
| capital_ledger_entries            | direction             | credit, debit                                                     |
| capital_ledger_entries            | status                | completed, pending, approved, rejected, cancelled                 |
| partner_profit_rules              | rule_type             | fixed_percent, product_based, capital_based, mixed                |
| partner_profit_rules              | profit_source         | capital_share, working_share, product_share, custom               |
| partner_profit_eligibilities      | status                | active, paused, ended                                             |
| partner_settlement_configs        | settlement_type       | profit_only, cost_plus_profit, custom                             |
| partner_settlement_configs        | payment_preference    | cash, bank_transfer, adjustment, reinvestment                     |
| partner_profit_rule_history       | change_type           | created, updated, approved, deactivated                           |
| partner_settlement_configs        | applies_to            | capital, working, product, all                                    |
| partner_profit_eligibilities      | applies_to            | capital, working, product, all                                    |
| sale_payments                     | payment_status_manual | pending_verification, verified, rejected                          |
| sales                             | courier_status        | pending, picked_up, in_transit, delivered, returned, walk_in      |
| legal_pages                       | type                  | privacy_policy, terms_conditions                                  |
| feature_announcements             | badge_type            | new, hot, beta, custom                                            |

---

## Reference Number Formats

| Module               | Format           | Example          |
| -------------------- | ---------------- | ---------------- |
| Sales                | SL-YYYYMMDD-XXXX | SL-20260711-0001 |
| Hold Orders          | HO-YYYYMMDD-XXXX | HO-20260711-0001 |
| Profit Distributions | PD-YYYY-000001   | PD-2026-000001   |
| Capital Ledger       | CL-YYYYMMDD-XXXX | CL-20260711-0001 |
| Partners             | PTR-001          | PTR-042          |

---

## Relationship Map — Partner Domain

```
partners
  ├── partner_investments (many) → investments
  ├── partner_profit_rules (many, versioned)
  │     └── partner_profit_rule_history (many, append-only)
  ├── partner_profit_eligibilities (many)
  ├── partner_product_assignments (many, polymorphic assignable)
  ├── partner_settlement_configs (many)
  ├── profit_distribution_items (many, via partner_id)
  ├── investor_profit_balances (many, via partner_id)
  ├── capital_ledger_entries (many, via partner_id)
  ├── investor_capital_balances (many, via partner_id)
  └── investment_fund_usages (many, via partner_id)
```

### sales additions (Item 4.9 migration)

email_sent_at (timestamp nullable)

### Sprint 3 — Fraud Protection

### fraud_flags

id, customer_id (FK customers nullable nullOnDelete),
phone (varchar), email (varchar nullable),
full_name_snapshot (varchar), address_snapshot (text nullable),
reason (enum: no_answer/refused_delivery/multiple_returns/fake_order/
failed_validation/ip_limit_exceeded/low_success_ratio/other),
reason_note (text),
trigger_type (enum: manual/auto_layer2/auto_layer3),
related_sale_ids (JSON nullable),
status (enum: pending_review/confirmed_fraud/cleared default: pending_review),
flagged_by (FK users nullable nullOnDelete — null = system-triggered),
flagged_at (timestamp),
reviewed_by (FK users nullable nullOnDelete),
reviewed_at (timestamp nullable),
review_note (text nullable),
external_fraud_check_response (JSON nullable — Phase 2 reserved),
timestamps
Indexes: phone, email, status, trigger_type, customer_id, flagged_at

Note: status excluded from $fillable — use confirmFraud() / clearFlag() model methods.
Note: flagged_by = null means system-triggered (auto_layer2 / auto_layer3).
Note: external_fraud_check_response never written in Phase 1.

### Sprint 4 — Order Tasks

### order_tasks

id, title (varchar), customer_name_snapshot (varchar),
customer_phone_snapshot (varchar nullable),
source (enum: facebook/instagram/whatsapp/phone/website/other),
priority (enum: urgent/normal/flexible default: normal),
due_date (date nullable), note (text nullable),
assignment_type (enum: assigned/open default: open),
assigned_to (FK users nullable nullOnDelete),
claimed_by (FK users nullable nullOnDelete),
claimed_at (timestamp nullable),
status (enum: pending/claimed/in_progress/ready/converted_to_sale/cancelled default: pending),
linked_sale_id (FK sales nullable nullOnDelete),
created_by (FK users restrict),
completed_by (FK users nullable nullOnDelete),
completed_at (timestamp nullable),
started_at (timestamp nullable),
timestamps, deleted_at
Indexes: status, priority, source, assignment_type, assigned_to, claimed_by, due_date

Note: claimed_by/claimed_at/status excluded from $fillable — set only via
atomic claim guard (DB::transaction + lockForUpdate) or forceFill()->save()

### Sprint 4 — Pre-Orders

### pre_orders

id, customer_id (FK customers nullable nullOnDelete),
customer_name_snapshot (varchar), customer_phone_snapshot (varchar nullable),
product_id (FK products nullable nullOnDelete),
product_name_snapshot (varchar nullable),
booking_date (date), expected_delivery_date (date nullable),
total_amount (decimal 10,2), advance_amount (decimal 10,2 default 0),
due_amount (decimal 10,2),
advance_payment_method (varchar nullable),
advance_transaction_id (varchar nullable),
advance_payment_proof (varchar nullable — file path),
status (enum: pending/confirmed/ready/delivered/cancelled default: pending),
linked_sale_id (FK sales nullable nullOnDelete),
note (text nullable),
created_by (FK users restrict), updated_by (FK users nullable nullOnDelete),
timestamps, deleted_at
Indexes: status, booking_date, expected_delivery_date, customer_id

Note: due_amount = total_amount − advance_amount (auto-calculated on store/update)
Note: status excluded from $fillable — set only via forceFill()->save()
Note: linked_sale_id filled on convertToSale() action — marks pre-order as delivered

### Sprint 4 — Product Planning Tasks

### product_planning_tasks

id, title (varchar), note (text nullable),
status (enum: pending/in_progress/done/cancelled default: pending),
due_date (date nullable),
created_by (FK users restrict), assigned_to (FK users nullable nullOnDelete),
completed_by (FK users nullable nullOnDelete), completed_at (timestamp nullable),
timestamps, deleted_at
Indexes: status, due_date, assigned_to

Note: status excluded from $fillable — set only via forceFill()->save() (Rule 66)

### product_planning_task_items

id, task_id (FK product_planning_tasks cascade),
product_id (FK products restrict), variant_id (FK product_variants nullable nullOnDelete),
quantity (decimal 10,2), unit_cost (decimal 10,2 nullable),
note (text nullable),
status (enum: pending/ready/cancelled default: pending),
timestamps
Indexes: task_id, status

### Enum Reference — add rows

| product_planning_tasks | status | pending, in_progress, done, cancelled |
| product_planning_task_items | status | pending, ready, cancelled |

### Sprint 5 — Quick Links (Item 1.15)

### quick_links

id, label (varchar), icon (varchar — lucide-react icon name e.g. "Package"),
route_name (varchar — Laravel named route e.g. "backend.products.index"),
sort_order (smallint unsigned default 0),
is_active (bool default true),
visible_to_roles (JSON nullable — null = visible to everyone),
timestamps

Note: QuickLink::scopeActive() orders by sort_order.
Note: isVisibleToRoles(array $roleNames) returns true when visible_to_roles is null (everyone).
Note: quickLinks prop in HandleInertiaRequests = role-filtered active links for AppLauncherModal.
Note: allQuickLinks prop = all links ordered by sort_order for Settings QuickLinksTab.

### Sprint 5 — Feature Announcements (Item 1.18)

### feature_announcements

id, label (varchar), route_name (varchar),
badge_type (enum: new/hot/beta/custom default: new),
badge_text (varchar nullable — used when badge_type = custom),
show_until (date — auto-expiry, no cron needed),
is_active (bool default true),
timestamps
Indexes: (is_active, show_until), route_name

Note: scopeVisible() filters is_active=true AND show_until >= today.
Note: Keyed by route_name in HandleInertiaRequests for O(1) sidebar lookup.
Note: No soft delete — hard delete only (no restore flow needed).
Note: No Policy class — FeatureAnnouncementController uses Gate::allows() directly.

### business_settings additions (Item 1.18)

hot_product_order_threshold (int default 10 — future use: "Hot" badge on Website products)

### 6. Enum Reference — add rows

| fraud_flags | reason | no_answer, refused_delivery, multiple_returns, fake_order, failed_validation, ip_limit_exceeded, low_success_ratio, other |
| fraud_flags | trigger_type | manual, auto_layer2, auto_layer3 |
| fraud_flags | status | pending_review, confirmed_fraud, cleared |

| order_tasks | source | facebook, instagram, whatsapp, phone, website, other |
| order_tasks | priority | urgent, normal, flexible |
| order_tasks | assignment_type | assigned, open |
| order_tasks | status | pending, claimed, in_progress, ready, converted_to_sale, cancelled |
| pre_orders | status | pending, confirmed, ready, delivered, cancelled |

## user_preferences

| Column     | Type      | Notes                               |
| ---------- | --------- | ----------------------------------- |
| id         | bigint    | PK                                  |
| user_id    | bigint    | FK users, unique, cascade delete    |
| theme_json | json      | nullable, merged with DEFAULT_THEME |
| ui_json    | json      | nullable, merged with DEFAULT_UI    |
| created_at | timestamp |                                     |
| updated_at | timestamp |                                     |

DEFAULT_THEME: {
primary_color: '#4F46E5',
sidebar_color: '#111827',
font_size: 'medium',
font_family: 'inter',
mode: 'system',
border_radius: 'medium',
preset: 'indigo'
}

DEFAULT_UI: {
sidebar_collapsed: false,
sidebar_width: 'normal',
density: 'comfortable',
card_style: 'flat',
sidebar_behavior: 'fixed',
reduce_motion: false
}
