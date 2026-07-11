# Database Schema — Master POS System

> Updated through: Step 17 Phase 1 — 2026-07-11

---

## Step 02 — Auth & Users

**users** — id, name, email, phone, password, status(enum:active/inactive), avatar(nullable), email_verified_at, remember_token, timestamps, deleted_at
**login_histories** — id, user_id(FK restrict), ip_address, user_agent, logged_in_at, timestamps
**activity_logs** — id, user_id(FK nullable nullOnDelete), module, action, description, subject_type(nullable), subject_id(bigint nullable), properties(json nullable), timestamps
**Spatie tables** — roles, permissions, model_has_roles, model_has_permissions, role_has_permissions

## Step 03 — Settings

**business_settings** — id, key(unique), value(text nullable), timestamps
**payment_methods** — id, name, is_active(bool), sort_order(int default 0), timestamps
**expense_categories** — id, name, color(nullable), is_active(bool), timestamps
**investment_types** — id, name, description(text nullable), is_active(bool), timestamps

## Step 04 — Products

**product_categories** — id, name, parent_id(FK nullable self-ref), is_active(bool), timestamps, deleted_at
**units** — id, name, abbreviation, is_active(bool), timestamps
**products** — id, name, sku(unique), barcode(nullable), category_id(FK restrict), unit_id(FK restrict), cost_price(dec10,2), last_purchase_price(dec10,2 nullable), average_cost(dec10,2 default 0), sale_price(dec10,2), is_taxable(bool), tax_id(nullable), discount_type(nullable), discount_value(dec10,2 nullable), stock_qty(dec10,2 default 0), low_stock_threshold(dec10,2 default 0), min_sale_qty(dec10,2 default 1), has_variants(bool), weight(dec10,3 nullable), weight_unit(nullable), is_featured(bool), sort_order(int), meta_title/meta_description/description(nullable), is_active(bool), timestamps, deleted_at
**product_images** — id, product_id(FK cascade), image_path, is_primary(bool), sort_order(int), timestamps

## Step 05 — Notifications

**notifications** — id(uuid PK), type, notifiable_type, notifiable_id, data(json), read_at(nullable), timestamps

## Step 06 — Suppliers

**suppliers** — id, name, company(nullable), email(unique nullable), phone(nullable), address(text nullable), city(nullable), country(default Bangladesh), opening_balance(dec10,2 default 0), is_active(bool), timestamps, deleted_at

## Step 07 — Purchases

**purchases** — id, supplier_id(FK restrict), reference_no(unique), purchase_date, purchase_status(enum: draft/ordered/received/partial_received/cancelled default:draft), subtotal/discount/tax/shipping_cost/grand_total/paid_amount/due_amount(dec10,2), payment_status(enum: paid/partial/due default:due), note(text nullable), created_by(FK restrict)/updated_by(FK nullable), timestamps, deleted_at
**purchase_items** — id, purchase_id(FK cascade), product_id(FK restrict), quantity(int unsigned), unit_cost/subtotal(dec10,2), timestamps
**purchase_payments** — id, purchase_id(FK cascade), payment_method_id(FK nullable nullOnDelete), amount(dec10,2), payment_date, reference(nullable), note(text nullable), created_by(FK restrict), timestamps
**stock_movements** — id, product_id(FK restrict), reference_type(nullable), reference_id(bigint nullable), type(enum: purchase/sale/return/adjustment/transfer), quantity(int), before_quantity/after_quantity(int), unit_cost(dec10,2 nullable), note(text nullable), created_by(FK nullable nullOnDelete), timestamps

## Step 08 — Customers

**customers** — id, name, email(unique nullable), phone(nullable), address(text nullable), city(nullable), country(default Bangladesh), opening_balance(dec10,2 default 0), is_active(bool), timestamps, deleted_at

## Step 09 — Sales

**sales** — id, reference_no(unique), customer_id(FK nullable nullOnDelete), sale_date, subtotal/discount/tax/grand_total/paid_amount/due_amount(dec10,2), payment_status(enum: paid/partial/due default:due), payment_method_id(FK nullable nullOnDelete), note(text nullable), created_by(FK restrict), timestamps, deleted_at
**sale_items** — id, sale_id(FK cascade), product_id(FK restrict), quantity(int unsigned), unit_price/discount/subtotal(dec10,2), timestamps
Reference format: SL-YYYYMMDD-XXXX

## Step 11 — Hold Orders (NO soft delete — hard delete only)

**hold_orders** — id, reference_no(unique), customer_id(FK nullable nullOnDelete), note(text nullable), status(enum: active/processing default:active), subtotal/discount/tax/grand_total(dec10,2 default 0), expires_at(nullable), created_by(FK restrict), timestamps
**hold_order_items** — id, hold_order_id(FK cascade), product_id(FK restrict), quantity(int unsigned), unit_price/discount/subtotal(dec10,2), timestamps
Reference format: HO-YYYYMMDD-XXXX

## Step 12 — Expenses (NO status column)

**expenses** — id, expense_category_id(FK restrict), payment_method_id(FK nullable nullOnDelete), title, amount(dec10,2), expense_date, reference(nullable), attachment(nullable), note(text nullable), created_by(FK restrict)/updated_by(FK nullable), timestamps, deleted_at

## Step 13 — Investments

**investments** — id, investment_type_id(FK restrict), title, investor_name, amount(dec10,2), investment_date, reference(nullable), attachment(nullable), note(text nullable), status(enum: active/withdrawn default:active), created_by(FK restrict)/updated_by(FK nullable), timestamps, deleted_at

## Step 14 — Profit Distribution

**profit_distributions** — id, distribution_no(varchar unique), title, distribution_date, period_start, period_end, total_revenue/total_cogs/total_expenses/total_investment/gross_profit/net_profit(dec10,2 default 0), distribution_percent(dec5,2 default 100), distributable_amount(dec10,2 default 0), status(enum: draft/approved/distributed default:draft), is_locked(bool default false), note(text nullable), approved_by(FK nullable nullOnDelete)/approved_at(nullable), distributed_by(FK nullable nullOnDelete)/distributed_at(nullable), created_by(FK restrict)/updated_by(FK nullable), timestamps, deleted_at
Distribution No format: PD-YYYY-000001

**profit_distribution_items** — id, profit_distribution_id(FK cascade), investment_id(FK restrict), investor_name/investment_title/investment_type(snapshots), invested_amount(dec10,2), share_percent(dec8,4), share_amount(dec10,2), distribution_percent(dec5,2 default 100), deferred_amount(dec10,2 default 0), reinvested_amount(dec10,2 default 0), carried_from_distribution_id(FK nullable nullOnDelete), payment_status(enum: pending/partial/paid/deferred/reinvested/cancelled/reopened default:pending), payment_method/transaction_reference(legacy nullable), paid_by(FK nullable nullOnDelete)/paid_at(nullable), note(text nullable), timestamps
NO deleted_at — cascadeOnDelete from parent

## Step 17 Phase 1 — Advanced Profit Distribution

**profit_distribution_eligibilities** — id, profit_distribution_id(FK cascade), investment_id(FK restrict), investor_name, is_eligible(bool default true), eligibility_reason(nullable), override_by(FK nullable nullOnDelete), override_at(nullable), timestamps
UNIQUE: (profit_distribution_id, investment_id)

**profit_distribution_item_payments** — id, profit_distribution_item_id(FK cascade), amount(dec10,2), payment_status(enum: pending/partial/paid/deferred/reinvested/cancelled/reopened default:pending), payment_method(nullable), transaction_reference(nullable), note(text nullable), paid_by(FK nullable nullOnDelete), paid_at(nullable), timestamps

**investor_profit_balances** — id, investment_id(FK restrict UNIQUE), investor_name, total_earned/total_paid/total_deferred/total_reinvested/pending_balance(dec10,2 default 0), timestamps

---

## Critical Column Notes

- products.category_id (NOT product_category_id)
- products.cost_price (NOT purchase_price/buying_price)
- products.stock_qty (NOT stock_quantity)
- products.low_stock_threshold (NOT low_stock_alert)
- expenses table has NO status column
- hold_orders has NO deleted_at (hard delete only)
- profit_distribution_items has NO deleted_at (cascade from parent)
- investor_profit_balances.investment_id is UNIQUE (one balance record per investor)
