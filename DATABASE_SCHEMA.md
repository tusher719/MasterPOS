# Database Schema — Master POS System

> Single source of truth for all table structures.
> Updated through: Step 17 Phase 1

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

---

## Step 08 — Customers

### customers

id, name, email(unique nullable), phone(nullable), address(text nullable),
city(nullable), country(varchar default 'Bangladesh'), opening_balance(dec10,2 default 0),
is_active(bool default true), timestamps, deleted_at

Note: opening_balance = historical balance before using this POS only.
Positive = customer owes business. Negative = business owes customer.

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

id, sale_id(FK sales cascade), product_id(FK products restrict),
quantity(int unsigned), unit_price(dec10,2), discount(dec10,2 default 0),
subtotal(dec10,2), timestamps

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
created_by(FK users restrict), updated_by(FK users nullable nullOnDelete),
timestamps, deleted_at
Attachment path: storage/app/public/investments/
Accepted types: jpg, jpeg, png, gif, webp, pdf, doc, docx, xlsx (max 5MB)

---

## Step 14 — Profit Distribution

### profit_distributions

id, distribution_no(varchar unique), title(varchar), distribution_date(date),
period_start(date), period_end(date),
total_revenue(dec10,2 default 0), total_cogs(dec10,2 default 0),
total_expenses(dec10,2 default 0), total_investment(dec10,2 default 0),
gross_profit(dec10,2 default 0), net_profit(dec10,2 default 0),
distribution_percent(dec5,2 default 100), distributable_amount(dec10,2 default 0),
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

id, profit_distribution_id(FK cascade), investment_id(FK restrict),
investor_name(varchar), investment_title(varchar), investment_type(varchar) — snapshots,
invested_amount(dec10,2), share_percent(dec8,4), share_amount(dec10,2),
distribution_percent(dec5,2 default 100), deferred_amount(dec10,2 default 0),
reinvested_amount(dec10,2 default 0),
carried_from_distribution_id(FK nullable nullOnDelete),
payment_status(enum: pending/partial/paid/deferred/reinvested/cancelled/reopened default:pending),
payment_method(varchar nullable), transaction_reference(varchar nullable) — legacy inline fields,
paid_by(FK users nullable nullOnDelete), paid_at(timestamp nullable),
note(text nullable), timestamps
**NO deleted_at — cascadeOnDelete from parent**

Fields excluded from $fillable (set only via model methods):
payment_status, payment_method, transaction_reference, paid_by, paid_at

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
total_earned(dec10,2 default 0), total_paid(dec10,2 default 0),
total_deferred(dec10,2 default 0), total_reinvested(dec10,2 default 0),
pending_balance(dec10,2 default 0), timestamps

---

## Enum Reference

| Table                             | Column          | Values                                                            |
| --------------------------------- | --------------- | ----------------------------------------------------------------- |
| users                             | status          | active, inactive                                                  |
| purchases                         | purchase_status | draft, ordered, received, partial_received, cancelled             |
| purchases                         | payment_status  | paid, partial, due                                                |
| sales                             | payment_status  | paid, partial, due                                                |
| hold_orders                       | status          | active, processing                                                |
| investments                       | status          | active, withdrawn                                                 |
| profit_distributions              | status          | draft, approved, distributed                                      |
| profit_distribution_items         | payment_status  | pending, partial, paid, deferred, reinvested, cancelled, reopened |
| profit_distribution_item_payments | payment_status  | pending, partial, paid, deferred, reinvested, cancelled, reopened |
| stock_movements                   | type            | purchase, sale, return, adjustment, transfer                      |

---

## Reference Number Formats

| Module               | Format           | Example          |
| -------------------- | ---------------- | ---------------- |
| Sales                | SL-YYYYMMDD-XXXX | SL-20260711-0001 |
| Hold Orders          | HO-YYYYMMDD-XXXX | HO-20260711-0001 |
| Profit Distributions | PD-YYYY-000001   | PD-2026-000001   |
