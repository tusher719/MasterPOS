# Gaps & Recommendations — Part B Core (Sprint 1–4 Active Work)

> Paste this file for Sprint 1–4 work.
> Always paste together with: MASTER_CONTEXT + PROJECT_RULES + DATABASE_SCHEMA + BUSINESS_RULES + ARCHITECTURE

---

## AI Usage Notes

- Read all other pasted files before this one.
- ONE item at a time per PROJECT_RULES.md Rule 1.
- No paid/premium services in Phase 1.
- After each item: update MASTER_CONTEXT, CHANGELOG, DATABASE_SCHEMA, BUSINESS_RULES, this file.
- Storefront (Section 10) is a NEW separate frontend surface — own routes, layout, auth guard, page directory (resources/js/Pages/Website/). Never mix into Pages/Backend/.
- Phase 1 (Now): Backend + Admin Panel + Storefront (manual payment, no gateway).
- Phase 2 (Later): Automated payment gateway + courier API.

## Legend

- ✅ Confirmed by user, ready to build
- 🔜 Deferred (Phase 2 / paid service)
- ⚠️ Needs clarification before building

---

## SPRINT 1 — Foundation & Safety

### 1.1 Settings — Fully Dynamic ✅ (Must Fix — blocks 1.2, 1.3, 10.2)

**Problem:** Settings update করলে শুধু settings page এ effect হয়।

**Fix:**

- SettingsService::get($key, $default) — cache-backed (Cache::remember)
- BusinessSetting Observer → Cache::forget() on every update
- HandleInertiaRequests shares full settings map globally (once, from cache)
- Frontend reads via usePage().props.settings.xxx
- One-time audit: find hardcoded frontend values → replace with settings

---

### 1.5 Super Admin Cascade Delete — Soft Only ✅ (Must Fix — safety correction)

**Hard delete rejected** — conflicts with snapshot accounting and partner preservation rules.

**Approved design:**

- Financial entities (Investment, Partner, Distribution, Sale, Purchase): cascade soft-delete only, never hard delete
- Hard/force delete: only non-financial data with no snapshot dependency (unused Category, Unit)
- Dependency preview shown before any delete action
- Dev-phase full resets: artisan command / seeder only — never a UI button

---

### 3.3 Product Variants ✅ (Must Fix — foundational)

```
product_variants: id, product_id (FK cascade), sku (unique),
  attributes (JSON — {"color":"Red","size":"XL"}),
  stock_qty (decimal 10,2),
  price_override (decimal 10,2 nullable),
  cost_price_override (decimal 10,2 nullable),
  image_id (nullable),
  is_active (bool default true),
  timestamps

sale_items additions: variant_id (FK product_variants nullable nullOnDelete)
stock_movements additions: variant_id (FK product_variants nullable nullOnDelete)
```

- Activates currently-unused products.has_variants flag

---

### 3.4 Product Slug — Secure Non-Guessable Immutable ✅ DONE

- Migration: slug (varchar unique) added to products table
- Existing products backfilled with unique slugs
- Product model boot: generating hook on creating, immutability guard on updating
- slug excluded from $fillable — cannot be mass-assigned
- ProductController: unset($data['slug']) in store() + update() as extra guard
- slug exposed in index() map + edit() props (read-only display)
- POS fix: handleAddToCart now uses min_sale_qty as initial quantity (not hardcoded 1)
- CartItem: decrement/increment step = min_sale_qty, input min = min_sale_qty
- CartItemRow interface: min_sale_qty field added

```
products additions: slug (varchar unique)
```

**Generation rule:**

- Auto-generated at creation: Str::slug($name) + 6 random alphanumeric chars
- Example: red-cotton-kurti-xl-4f9a2c
- Immutable after creation — no admin override
- Name change later → slug stays the same (SEO + security)

---

### 3.5 Inventory Sync Safety + Stock Reservation ✅ DONE

- lockForUpdate() + DB::transaction() around all stock deductions

```
stock_reservations: id, product_id (FK restrict),
  variant_id (FK nullable),
  sale_id (FK nullable — filled on conversion),
  quantity (decimal 10,2),
  reserved_until (timestamp),
  status (enum: active/converted/expired/released),
  timestamps

business_settings additions:
  stock_reservation_minutes (int default 30)
```

**Flow:**

- Storefront order placed → stock reserved (not deducted yet)
- Payment verified → status = converted, real stock deduction
- Window expires → status = expired, stock released automatically
- Scheduled job (Laravel schedule) sweeps expired reservations

---

### 5.1 Payment Method Charge Config ✅ DONE

Extends existing payment_methods table in Settings.

```
payment_methods additions:
  online_charge_type (enum: percent/fixed nullable)
  online_charge_value (decimal 10,2 default 0)
  charge_enabled (bool default false)
  charge_label (varchar nullable — e.g. "bKash Charge (1.5%)")
```

**Total breakdown everywhere:**

```
Subtotal:          ৳X
Delivery Charge:   ৳X
Payment Charge:    ৳X  ← dynamic, based on selected method/bank
───────────────────────
Total:             ৳X
```

**Applies to:** POS checkout, Storefront checkout, sale_payments modal, Invoice/Receipt

---

### 5.2 Individual Bank under Bank Transfer ✅ DONE

```
payment_method_banks: id,
  payment_method_id (FK payment_methods restrict),
  bank_name (varchar),
  account_number (varchar nullable),
  account_name (varchar nullable),
  charge_type (enum: percent/fixed nullable),
  charge_value (decimal 10,2 default 0),
  charge_enabled (bool default false),
  charge_label (varchar nullable),
  is_active (bool default true),
  sort_order (int default 0),
  timestamps
```

**Logic:**

- Payment method = "Bank Transfer" → individual bank list shown
- Customer/Staff selects specific bank → that bank's charge applies
- bKash, Nagad, Rocket → use payment_methods charge directly (no bank list)
- Bank Transfer → select bank → bank-level charge applies

---

## SPRINT 2 — Sales / Delivery / Payment Core

### 4.1 Order Status Workflow ✅ DONE

```
sales additions:
  order_status (enum: processing/confirmed/out_for_delivery/delivered/cancelled/returned)
    default: processing
  payment_type (enum: full_paid/half_paid/cash_on_delivery)
```

---

### 4.2 Delivery Details ✅ (Must Fix)

**Confirmed:** Delivery charge added to customer total as separate line item.
Admin can set 0 (free delivery flag).

```
sales additions:
  delivery_type (enum: store_pickup/inside_dhaka/outside_dhaka/parallel nullable)
  delivery_charge (decimal 10,2 nullable default 0)
  delivery_charge_free (bool default false)
  delivery_address (text nullable)
  delivery_contact_phone (varchar nullable)
  delivery_status (enum: pending/dispatched/delivered/failed nullable)
```

---

### 4.3 Multi-Payment History — sale_payments (Must Fix)

Mirrors existing purchase_payments pattern.

```
sale_payments: id, sale_id (FK cascade),
  payment_method_id (FK payment_methods nullable nullOnDelete),
  payment_method_bank_id (FK payment_method_banks nullable nullOnDelete),
  amount (decimal 10,2),
  payment_charge (decimal 10,2 default 0),
  payment_date (date),
  reference (varchar nullable),
  note (text nullable),
  payment_proof_image (varchar nullable),
  payment_status_manual (enum: pending_verification/verified/rejected),
  transaction_id (varchar nullable),
  verified_by (FK users nullable nullOnDelete),
  verified_at (timestamp nullable),
  created_by (FK users restrict),
  timestamps
```

---

### 4.4 POS Terminal Payment Type Selection (Must Fix)

- Staff selects: Full Paid / Half Paid / Cash on Delivery at checkout
- Payment method charge auto-calculates on method selection
- Same manual bKash/Nagad verification flow as storefront (10.6)

---

### 4.5 COD Delivery + Payment Collection Flow (Must Fix)

- Single combined action from Sales History
- "Mark as Delivered + Collect Payment" → sets delivery_status = delivered AND creates sale_payments entry in one step

---

### 4.6 Courier Integration — Manual Now ✅ (Must Fix / 🔜 API Later)

```
sales additions:
  courier_provider (varchar nullable)
  courier_tracking_id (varchar nullable)
  courier_status (varchar nullable)
```

---

### 4.7 Sales History Page — Purchases-style UI (Must Fix)

- List + multi-select checkboxes
- Bulk: status update, cancel, mark as returned
- Cancel/Return → automatic stock reverse
- Payment History modal per sale
- Print: Invoice + Delivery Slip/Challan (separate)
- Export: CSV/Excel/PDF, filterable

---

### 4.8 Sale Status History (Must Fix)

```
sale_status_histories: id, sale_id (FK cascade),
  status (varchar),
  note (text nullable),
  changed_by (FK users nullable nullOnDelete),
  timestamps
```

Powers customer-facing tracking timeline (4.11 + storefront 10.9).

---

### 4.9 Order Confirmation Email — Opt-in from POS (Should Fix)

```
sales additions: email_sent_at (timestamp nullable)
```

- Checkbox on POS checkout: "Send email confirmation to customer"
- Includes: items + total, payment type, method + TrxID if paid, delivery charge if COD

---

## SPRINT 3 — Fraud Protection

### 6.1 Fraud Flags — Core Table (Must Fix)

```
fraud_flags: id,
  customer_id (FK nullable nullOnDelete),
  phone (varchar normalized),
  email (varchar normalized nullable),
  full_name_snapshot (varchar),
  address_snapshot (text nullable),
  reason (enum: no_answer/refused_delivery/multiple_returns/fake_order/
    failed_validation/ip_limit_exceeded/low_success_ratio/other),
  reason_note (text),
  trigger_type (enum: manual/auto_layer2/auto_layer3),
  related_sale_ids (JSON nullable),
  status (enum: pending_review/confirmed_fraud/cleared),
  flagged_by (FK users nullable — null = system-triggered),
  flagged_at (timestamp),
  reviewed_by (FK users nullable),
  reviewed_at (timestamp nullable),
  review_note (text nullable),
  external_fraud_check_response (JSON nullable — 🔜 future paid API),
  timestamps
```

**Workflow:** System creates pending_review only. Admin/Fraud Manager confirms or clears.

**New Role:** Fraud Manager
**New Permissions:** fraud.flag, fraud.review

---

### 6.2 Layer 1 — Basic Form Validation (Must Fix)

At checkout (POS + storefront):

- Phone: matches 01[3-9]XXXXXXXX Bangladeshi format
- Name: not empty / not purely numeric / not special chars only
- Address: minimum word count + light gibberish heuristic
- No paid validation service — free logic only

---

### 6.3 Layer 2 — IP Order Limit (Must Fix)

```
order_attempt_logs: id,
  ip_address (varchar),
  phone (varchar nullable),
  attempted_at (timestamp),
  was_blocked (bool default false),
  timestamps

business_settings additions:
  fraud_ip_order_limit_per_24h (int default 3)
```

- Exceeds limit → auto-blocked + fraud_flags entry (trigger_type = auto_layer2)

---

### 6.4 Layer 3 — Internal Success Ratio Check (Must Fix / 🔜 External API Later)

```
business_settings additions:
  fraud_success_ratio_threshold (int default 60)
  fraud_min_orders_before_check (int default 3)
```

- success_ratio = delivered_orders / total_orders per phone number
- Below threshold AND min orders met → auto-blocked + fraud_flags entry (trigger_type = auto_layer3)

---

### 6.5 Order-Blocked Popup (Must Fix — bundled with 6.3/6.4)

```
business_settings additions:
  fraud_block_message (text)
  fraud_contact_whatsapp (varchar nullable)
  fraud_contact_phone (varchar nullable)
  fraud_contact_facebook (varchar nullable)
```

Modal UI:

```
┌─────────────────────────────────────┐
│              ❌                      │
│  অর্ডারটি গ্রহণ করা সম্ভব হচ্ছে না! │
│  [customizable message]              │
│  [WhatsApp]  [Call]  [Facebook]      │
└─────────────────────────────────────┘
```

---

## SPRINT 4 — Fulfillment Ops

### 8.1 Order Task / Fulfillment Queue ✅ (Must Fix)

```
order_tasks: id,
  title (varchar),
  customer_name_snapshot (varchar),
  customer_phone_snapshot (varchar nullable),
  source (enum: facebook/instagram/whatsapp/phone/website/other),
  priority (enum: urgent/normal/flexible),
  due_date (date nullable),
  assignment_type (enum: assigned/open),
  assigned_to (FK users nullable nullOnDelete),
  claimed_by (FK users nullable nullOnDelete),
  claimed_at (timestamp nullable),
  status (enum: pending/claimed/in_progress/ready/converted_to_sale/cancelled),
  linked_sale_id (FK sales nullable nullOnDelete),
  note (text nullable),
  created_by (FK users restrict),
  completed_by (FK users nullable nullOnDelete),
  completed_at (timestamp nullable),
  started_at (timestamp nullable),
  timestamps
```

**Claim guard (open tasks — atomic lock):**

```php
DB::transaction(function () use ($taskId, $userId) {
    $task = OrderTask::where('id', $taskId)->lockForUpdate()->first();
    if ($task->claimed_by !== null) {
        throw new RuntimeException('Already claimed by someone else.');
    }
    $task->forceFill(['claimed_by' => $userId, 'claimed_at' => now(), 'status' => 'claimed'])->save();
});
```

**New Role:** Moderator (can claim/complete, cannot assign)
**Permissions:** order_task.view, order_task.create, order_task.assign, order_task.claim, order_task.complete

---

### 8.2 Staff/Moderator Performance Report (Should Fix — bundled with 8.1)

- Filter: staff/moderator, date range, source, status
- Metrics: total claimed/assigned, total completed, avg completion time, cancelled count

---

### 8.3 Pre-Order / Booking System ✅ (Should Fix)

```
pre_orders: id,
  customer_id (FK nullable nullOnDelete),
  customer_name_snapshot (varchar),
  customer_phone_snapshot (varchar nullable),
  product_id (FK nullable nullOnDelete),
  booking_date (date),
  expected_delivery_date (date nullable),
  total_amount (decimal 10,2),
  advance_amount (decimal 10,2 default 0),
  due_amount (decimal 10,2),
  advance_payment_method (varchar nullable),
  advance_transaction_id (varchar nullable),
  advance_payment_proof (varchar nullable),
  status (enum: pending/confirmed/ready/delivered/cancelled),
  linked_sale_id (FK sales nullable nullOnDelete),
  note (text nullable),
  created_by (FK users restrict),
  timestamps
```

**Permissions:** pre_order.view, pre_order.create, pre_order.manage

---

### 3.8 Product Planning Task Manager ✅ (Should Fix — internal tool)

Internal tool for planning and tracking product preparation.
Separate from Order Tasks (8.1).

```
product_planning_tasks: id,
  title (varchar),
  note (text nullable),
  status (enum: pending/in_progress/done/cancelled) default: pending,
  due_date (date nullable),
  created_by (FK users restrict),
  assigned_to (FK users nullable),
  completed_by (FK users nullable),
  completed_at (timestamp nullable),
  timestamps

product_planning_task_items: id,
  task_id (FK cascade),
  product_id (FK products restrict),
  variant_id (FK product_variants nullable),
  quantity (decimal 10,2),
  unit_cost (decimal 10,2 nullable),
  note (text nullable),
  status (enum: pending/ready/cancelled) default: pending,
  timestamps
```

**Features:**

- Multi-product add with quantity + unit cost per item
- Per-item status + task-level status
- Subtotal per product + grand total auto-calculation
- Created by + assigned to visible
- Due date optional

**Permissions:** product_task.view, product_task.create, product_task.edit, product_task.delete

---

## Open Questions — All Resolved ✅

| Item    | Question                  | Confirmed Answer                                                                                            |
| ------- | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 2.1     | Self-registration exists? | No — Admin creates all staff accounts. Persistent email verification banner after login. Login not blocked. |
| 4.12    | Refund handling?          | Option B — distinct refund entry in sale_payments                                                           |
| 6.3/7.3 | Discount stack order?     | Festival/Product discount first → Coupon last (if coupon_stackable = true, admin toggleable)                |
| 4.2     | Delivery charge?          | Customer pays — separate line item. Admin can set 0 (free delivery flag).                                   |

---

## Cross-References

- All tables: id + timestamps, deleted_at where soft-deletable, decimal(10,2) for money
- ActivityLogService::log() on every create/update/delete
- Approval-gated fields: forceFill()->save() pattern (Rule 66)
- Date inputs: AppDateInput/AppDateRangeInput always (Rule 19)
- Mantine: selective only — dates, carousel, tiptap, charts (Rule 11)
- No paid services in Phase 1
