# Gaps & Recommendations — Master Business Suite (Complete Reference)

> Single combined document.
> Paste this ONE file together with the other 6 documentation files
> (MASTER_CONTEXT.md, PROJECT_RULES.md, DATABASE_SCHEMA.md, CHANGELOG.md,
> BUSINESS_RULES.md, ARCHITECTURE.md) at the start of any new chat.

**Contents:**

- **Part A** — Original POS-era gaps (all ✅ Done, kept for history)
- **Part B** — Online Business Expansion (new features, planning stage)

---

# PART A — Original Gaps (All ✅ Done — History Only)

## AI Usage Notes (Part A)

- Items marked ✅ Done are already implemented — do not rebuild them.
- This section is kept for project history only.

## Summary Table

| Gap     | Title                                               | Priority     | Status                     |
| ------- | --------------------------------------------------- | ------------ | -------------------------- |
| 1.1     | Partner Profit Balance (working/product)            | Should Fix   | ✅ Done (built in Gap 4.2) |
| 1.2     | Investor Statement — Partner support                | Should Fix   | ✅ Done                    |
| 1.3     | Distribution List Source Type Badge                 | Nice to Have | ✅ Done                    |
| 1.4     | Partner Financial Overview page                     | Nice to Have | ✅ Done                    |
| 1.5     | Investment/Partner Show Page Financial Summary      | Must Fix     | ✅ Done                    |
| 2.1     | Partner Type ↔ Rule Validation                      | Must Fix     | ✅ Done                    |
| 2.2     | Settlement Config Approval Columns                  | Must Fix     | ✅ Done                    |
| 2.3     | Mixed Partner per-type Settlement/Eligibility       | Nice to Have | ✅ Done                    |
| 2.4     | Mixed Rule Resolution clarification                 | Should Fix   | ✅ Done (doc only)         |
| 2.5     | Verify Deactivated Partner Guard                    | Must Fix     | ✅ Done (guard existed)    |
| 3       | Investor → Partner Naming Migration                 | Nice to Have | ✅ Partially Done          |
| 4.1     | Capital Principal Lock + Partial Unlock             | Must Fix     | ✅ Done                    |
| 4.2     | Product Partner Cost/Profit Split                   | Must Fix     | ✅ Done                    |
| 4.3     | Business Owner residual profit                      | Doc only     | ✅ Done                    |
| 4.4+4.5 | Duplicate Prevention + Per-Partner Effective Period | Must Fix     | ✅ Done                    |

## Key Formulas Confirmed

- Capital Lock: `unlocked_amount = MIN(total_deposited, total_sales_since_investment_date)`
- Effective Period: `Effective Start = MAX(selected_start, eligibility_start, last_paid_up_to + 1 day)`
- Settled statuses for overlap: `paid`, `reinvested`, `deferred`

---

# PART B — Online Business Expansion

## AI Usage Notes

- Read Part A + all 6 other docs before building anything here
- Follow PROJECT_RULES.md Rule 1 — ONE item at a time, in sprint order
- After each item: update MASTER_CONTEXT, CHANGELOG, DATABASE_SCHEMA, BUSINESS_RULES, this file
- No paid/premium services in Phase 1 — see Section 12 for Phase 2 paid items
- Phase 1: Backend + Admin Panel + Storefront (manual payment verification)
- Phase 2: Automated payment gateway + courier API (when business is ready)

## Legend

- ✅ Confirmed by user, ready to build
- 🔜 Deferred (Phase 2 / paid service)
- ⚠️ Open question

---

## 1. Core System / Admin Panel Foundation

### 1.1 Settings — Fully Dynamic ✅ (Must Fix — blocks 1.2, 1.3, 11.2)

**Problem:** Settings update করলে শুধু settings page এ effect হয়, বাকি app এ propagate হয় না।

**Fix:**

- `SettingsService::get($key, $default)` — cache-backed (`Cache::remember`)
- `BusinessSetting` Observer → `Cache::forget()` on every update
- `HandleInertiaRequests` shares full settings map globally (once, from cache)
- Frontend reads via `usePage().props.settings.xxx`
- One-time audit: find hardcoded frontend values → replace with settings

**Priority:** Must Fix

---

### 1.2 Dynamic Navbar Logo (Should Fix — depends on 1.1)

business_settings keys:
logo_type: 'image' | 'text'
logo_image_path
logo_text_segments: JSON [{ text: "Master", color: "
#ffffff" }, { text: "POS", color: "
#ef4444" }]

- Navbar renders segments as `<span style={{color}}>`
- Settings page shows live preview
- Feeds into PDF/Print branding (1.11)

---

### 1.3 Admin Panel Theme — Per-User Personal (Should Fix — depends on 1.1)

> ⚠️ This is NOT the same as Website Color Palette (11.2). Two separate systems.

|              | Admin Panel Theme                    | Website Color Palette               |
| ------------ | ------------------------------------ | ----------------------------------- |
| Scope        | Personal — each user picks their own | Global — one palette for storefront |
| Who controls | Any logged-in backend user           | Super Admin only                    |
| Effect       | Only that user's backend view        | Every visitor's storefront          |

user_preferences: id, user_id (FK unique), theme_json, timestamps
theme_json: { primary_color, bg_image_url, font_family, font_size, mode: 'light'|'dark', border_radius }

- Loaded on login, injected as CSS custom properties on `<html>`
- Also stores Grid/List view preference (3.2)

---

### 1.4 Global Trash Bin Page (Should Fix)

- Single page, module filter dropdown
- `deleted_by` column added to all soft-deletable tables that don't already track it
- Restore + Force Delete actions

---

### 1.5 Super Admin Cascade Delete — Soft Only ✅ (Must Fix — safety correction)

**Hard delete rejected** — conflicts with snapshot accounting and partner preservation rules.

**Approved design:**

- Financial entities (Investment, Partner, Distribution, Sale, Purchase): cascade soft-delete only
- Hard/force delete: only non-financial data with no snapshot dependency (unused Category, Unit)
- Dependency preview shown before any delete action
- Dev-phase full resets: artisan command / seeder — never a UI button

---

### 1.6 Dynamic Notifications — click → detail page (Should Fix)

- `notifications.data` JSON gets `{type, id}` or `url` at creation time
- Frontend click → `router.visit()`
- No schema change — only notification-creation call sites updated

---

### 1.7 Split Backend Dashboard into Module Dashboards (Should Fix)

- `/dashboard` stays as overview
- New: `/dashboard/inventory`, `/dashboard/investments`, `/dashboard/sales`
- Each its own single-AJAX-call endpoint (per ARCHITECTURE.md Section 8)
- Navbar "Dashboards" becomes a dropdown group

---

### 1.8 Live Login / Active Status (Should Fix)

users additions: last_seen_at (timestamp nullable)

- Middleware updates throttled (once per minute, not every request)
- Green dot if `last_seen_at` within 5 minutes
- `dayjs().fromNow()` for "active 1h ago" text
- Login History page polls every 30–60s via axios

---

### 1.9 Global Search Ctrl+K — Backend (Should Fix)

- Command-palette style, glassmorphism design
- Scoped to: Products, Customers, Suppliers, Sales (by reference_no), Investments, Partners
- Debounced, keyboard-navigable, category-grouped results
- Suggestions list with icons
- Recent Searches as pills with Clear action
- `Ctrl+K` shortcut hint inside the box
- Same visual pattern reused for Website Product Search (11.7)

---

### 1.10 Audit Trail Viewer UI (Should Fix)

- `activity_logs` table already exists — only viewer page missing
- Filterable by module / action / user / date range
- Click entry → navigates to `subject_type`/`subject_id`

---

### 1.11 PDF/Print Branding (Should Fix — depends on 1.1 + 1.2)

- Audit all PDF Blade templates (Invoice, Investor Statement, Partner Statement, Reports)
- Replace hardcoded logo paths with dynamic settings value

---

### 1.12 Navbar Calculator Modal (Nice to Have)

- Pure frontend, global modal at layout level
- No backend needed

---

### 1.13 Full UI Animation + Responsiveness (Standing Rule)

Not a feature — a rule for all future work:

- `transition-all duration-200` on all interactive elements
- Modal fade/scale animations
- Table row hover states
- Responsive breakpoints on every new component
- Applies to backend admin panel AND storefront equally

---

### 1.14 Fallback / 404 Pages — 3 Surfaces (Should Fix)

| Surface             | Layout Used                       |
| ------------------- | --------------------------------- |
| Backend Admin Panel | Admin Panel layout/theme          |
| POS Terminal        | POS layout                        |
| Public Website      | Storefront layout + color palette |

- Message: "Page not found" / "এই পাতাটি খুঁজে পাওয়া যায়নি"
- "Back to Home" button per surface
- No new table needed

---

## 2. Auth / Security / User Management

### 2.1 Staff Email Verification — Persistent Banner ✅ (Must Fix)

**Confirmed flow:**

- Admin creates all staff accounts manually (no public self-registration)
- After login, staff sees persistent email verification banner
- Banner cannot be permanently dismissed — reappears on profile visit
- Login is NOT blocked — only persistent reminder
- Backend: Admin sees verified/unverified badge per staff on Users page

users: email_verified_at already exists in schema — enforce UI layer only

---

### 2.2 Default Role Assignment (Must Fix)

business_settings: default_registration_role_id

- Auto-assigned to new staff accounts created by Admin
- Admin can change individual user role anytime (existing Spatie flow)

---

### 2.3 Optional 2FA — Authenticator App (Nice to Have)

> Not the same as 2.1. This happens every login via authenticator app.

- Fully opt-in, never mandatory
- Any logged-in user can enable from Profile Settings

users additions:
two_factor_secret (encrypted nullable)
two_factor_enabled_at (timestamp nullable)
two_factor_recovery_codes (encrypted JSON nullable)

- Free library: `pragmarx/google2fa-laravel`

---

### 2.4 Employee/User Profile Page (Should Fix)

- Capital + Profit summary (if linked Partner)
- Salary/Payroll summary (if employee — see 2.5)
- 2FA toggle (2.3) lives here
- Read-only self-service view

---

### 2.5 Salary / Payroll — Independent Domain (Should Fix)

Per BUSINESS_RULES.md Section 1 — Salary stays independent from Capital and Profit.

employee_salaries: id, user_id, amount, pay_date, status, timestamps

- Combine with HR (Section 14) later if needed

---

## 3. Products / Inventory

### 3.1 Product Dynamic Search / Autocomplete Backend (Should Fix)

- Debounced ~300ms AJAX endpoint (`ProductController::search()`)
- Shows: thumbnail, name, sale_price, stock_qty, low-stock badge, status
- Same UX as POS Terminal today, extended to Products Index page

---

### 3.2 Products Grid / List View Toggle (Nice to Have)

- Toggle on Products Index — Grid (image cards) vs List (current table)
- Preference stored in `user_preferences` (1.3)

---

### 3.3 Product Variants ✅ (Must Fix — foundational)

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

- Activates currently-unused `products.has_variants` flag

---

### 3.4 Product Slug — Secure Non-Guessable Immutable ✅ (Must Fix — before storefront)

products additions: slug (varchar unique)

**Generation rule:**

- Auto-generated at creation: `Str::slug($name)` + `-` + 6 random alphanumeric chars
- Example: `red-cotton-kurti-xl-4f9a2c`
- Immutable after creation — no admin override
- Name change later → slug stays the same

---

### 3.5 Inventory Sync Safety + Stock Reservation ✅ (Must Fix — before storefront)

- `lockForUpdate()` + `DB::transaction()` around all stock deductions

stock_reservations: id, product_id (FK restrict),
variant_id (FK nullable),
sale_id (FK nullable — filled on conversion),
quantity (decimal 10,2),
reserved_until (timestamp),
status (enum: active/converted/expired/released),
timestamps

business_settings additions:
stock_reservation_minutes (int default 30)

**Flow:**

- Storefront order placed → stock reserved (not deducted)
- Payment verified → `status = converted`, real stock deduction
- Window expires → `status = expired`, stock released
- Scheduled job sweeps expired reservations

---

### 3.6 Universal Import/Export (Should Fix)

**Whitelist (safe):** Products, Categories, Units, Customers, Suppliers, Expense Categories, Payment Methods
**Financial tables:** export only, never import

- `maatwebsite/excel` Import classes with `WithValidation`, `SkipsOnError`
- Preview/dry-run screen before committing rows

---

### 3.7 Purchase Return / Damage-Wastage Tracking (Should Fix)

- Symmetric to Sales Return workflow (4.12) but on supplier side

---

### 3.8 Product Planning Task Manager ✅ (NEW — Internal)

Internal tool for planning and tracking product preparation — separate from Order Tasks (8.1).

product_planning_tasks: id, title,
note (text nullable),
status (enum: pending/in_progress/done/cancelled) default: pending,
due_date (date nullable),
created_by (FK users restrict),
assigned_to (FK users nullable),
completed_by (FK users nullable),
completed_at (timestamp nullable),
timestamps

product_planning_task_items: id, task_id (FK cascade),
product_id (FK products restrict),
variant_id (FK product_variants nullable),
quantity (decimal 10,2),
unit_cost (decimal 10,2 nullable),
note (text nullable),
status (enum: pending/ready/cancelled) default: pending,
timestamps

**Features:**

- Multi-product add with quantity + unit cost per item
- Per-item status (pending/ready/cancelled)
- Task-level status (pending/in_progress/done/cancelled)
- Subtotal per product + grand total auto-calculation
- Created by + assigned to visible
- Due date optional

**Permissions:** `product_task.view`, `product_task.create`, `product_task.edit`, `product_task.delete`

---

## 4. Sales / Order / Delivery / Payment

### 4.1 Order Status Workflow (Must Fix)

sales additions:
order_status (enum: processing/confirmed/out_for_delivery/delivered/cancelled/returned)
default: processing
payment_type (enum: full_paid/half_paid/cash_on_delivery)

---

### 4.2 Delivery Details ✅ (Must Fix)

**Confirmed:** Delivery charge added to customer total as separate line item. Admin can set 0 (free delivery flag).

sales additions:
delivery_type (enum: store_pickup/inside_dhaka/outside_dhaka/parallel nullable)
delivery_charge (decimal 10,2 nullable default 0)
delivery_charge_free (bool default false)
delivery_address (text nullable)
delivery_contact_phone (varchar nullable)
delivery_status (enum: pending/dispatched/delivered/failed nullable)

---

### 4.3 Multi-Payment History — sale_payments (Must Fix)

Mirrors existing `purchase_payments` pattern.

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

---

### 4.4 POS Terminal Payment Type Selection (Must Fix)

- Staff selects: Full Paid / Half Paid / Cash on Delivery at checkout
- Payment method charge auto-calculates on method selection
- Same manual bKash/Nagad verification flow as storefront

---

### 4.5 COD Delivery + Payment Collection Flow (Must Fix)

- Single combined action from Sales History
- "Mark as Delivered + Collect Payment" → sets `delivery_status = delivered` AND creates `sale_payments` entry

---

### 4.6 Courier Integration — Manual Now, API-Ready Later (Must Fix / 🔜 API)

sales additions:
courier_provider (varchar nullable)
courier_tracking_id (varchar nullable)
courier_status (varchar nullable)

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

sale_status_histories: id, sale_id (FK cascade),
status (varchar),
note (text nullable),
changed_by (FK users nullable nullOnDelete),
timestamps

Powers customer-facing tracking timeline (4.11 + 11.9).

---

### 4.9 Order Confirmation Email — Opt-in from POS (Should Fix)

sales additions: email_sent_at (timestamp nullable)

- Checkbox on POS checkout: "Send email confirmation to customer"
- Includes: items + total, payment type, method + TrxID if paid, delivery charge if COD

---

### 4.10 SMS/Email Notification Provider (Should Fix / 🔜 WhatsApp Later)

notification_logs: id, sale_id,
channel (enum: email/sms/whatsapp),
recipient (varchar),
message_type (enum: order_confirmation/status_update/voucher),
status (enum: sent/failed),
provider_response (text nullable),
timestamps

---

### 4.11 Order Tracking by Track ID (Should Fix)

- Public lookup page — customer enters `reference_no` → sees `sale_status_histories` timeline
- No login required
- Becomes part of customer portal (11.9) once storefront ships

---

### 4.12 Customer Return/Refund Workflow ✅ (Should Fix)

**Confirmed:** Option B — distinct `refund` entry in `sale_payments` (not negative ledger balance).

return_requests: id, sale_id (FK restrict),
customer_id (FK restrict),
reason (text),
status (enum: requested/approved/rejected/picked_up/refunded),
refund_method (enum: original_payment/store_credit/bank_transfer),
refund_amount (decimal 10,2),
admin_note (text nullable),
processed_by (FK users nullable nullOnDelete),
timestamps

return_request_items: id, return_request_id (FK cascade),
sale_item_id (FK restrict),
quantity (decimal 10,2),
reason (text nullable),
timestamps

---

### 4.13 Guest/Walk-in Checkout Fields — POS Only (Should Fix)

sales additions:
guest_email (varchar nullable)
guest_phone (varchar nullable)

Note: Storefront checkout requires login (11.5) — these columns are for POS walk-in orders only.

---

## 5. Payment Methods — Settings Extension ✅

### 5.1 Payment Method Charge Config (Must Fix)

Extends existing `payment_methods` table in Settings.

payment_methods additions:
online_charge_type (enum: percent/fixed nullable)
online_charge_value (decimal 10,2 default 0)
charge_enabled (bool default false)
charge_label (varchar nullable — e.g. "bKash Charge (1.5%)")

**Applies dynamically to:** POS checkout, Storefront checkout, sale_payments modal, Invoice/Receipt

**Total breakdown everywhere:**

Subtotal: ৳X
Delivery Charge: ৳X
Payment Charge: ৳X ← dynamic, based on selected method/bank
───────────────────────
Total: ৳X

---

### 5.2 Individual Bank under Bank Transfer (Must Fix)

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

**Logic:**

- Payment method = "Bank Transfer" → individual bank list shown
- Customer/Staff selects specific bank → that bank's charge applies
- bKash, Nagad, Rocket → use `payment_methods` charge directly (no bank list)
- Bank Transfer → select bank → bank-level charge

---

## 6. Fraud / Risk Management

### 6.1 Fraud Flags — Core Table (Must Fix)

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

**Workflow:** System creates `pending_review` only. Admin/Fraud Manager confirms or clears.

**New Role:** Fraud Manager
**New Permissions:** `fraud.flag`, `fraud.review`

---

### 6.2 Layer 1 — Basic Form Validation (Must Fix)

At checkout (POS + storefront):

- Phone: matches `01[3-9]XXXXXXXX` Bangladeshi format
- Name: not empty / not purely numeric / not special chars only
- Address: minimum word count + light gibberish heuristic
- No paid validation service — free logic only

---

### 6.3 Layer 2 — IP Order Limit (Must Fix)

order_attempt_logs: id,
ip_address (varchar),
phone (varchar nullable),
attempted_at (timestamp),
was_blocked (bool default false),
timestamps

business_settings additions:
fraud_ip_order_limit_per_24h (int default 3)

- Exceeds limit → auto-blocked + `fraud_flags` entry (`trigger_type = auto_layer2`)

---

### 6.4 Layer 3 — Internal Success Ratio Check (Must Fix / 🔜 External API Later)

business_settings additions:
fraud_success_ratio_threshold (default: 60)
fraud_min_orders_before_check (default: 3)

- `success_ratio = delivered_orders / total_orders` per phone number
- Below threshold AND min orders met → auto-blocked + `fraud_flags` entry (`trigger_type = auto_layer3`)

---

### 6.5 Order-Blocked Popup (Must Fix — bundled with 6.3/6.4)

business_settings additions:
fraud_block_message (text)
fraud_contact_whatsapp (varchar nullable)
fraud_contact_phone (varchar nullable)
fraud_contact_facebook (varchar nullable)

Modal UI:

┌─────────────────────────────────────┐
│ ❌ │
│ অর্ডারটি গ্রহণ করা সম্ভব হচ্ছে না! │
│ [customizable message] │
│ [WhatsApp] [Call] [Facebook] │
└─────────────────────────────────────┘

---

### 6.6 Layer 4 — Facebook Pixel Deduplication (Should Fix — with storefront)

sales additions: pixel_event_id (varchar unique nullable)

- Unique `event_id` generated at order creation
- Sent both client-side (Pixel) + server-side (Meta Conversions API — free)
- Meta deduplicates automatically

---

### 6.7 Customer Reliability Score (Nice to Have)

- Informational badge: delivery success %, return rate %
- Shown on Customer Show page
- Separate from fraud_flags — non-blocking

---

## 7. Customer Engagement / Marketing

### 7.1 Product Reviews & Ratings ✅ (Must Fix)

product_reviews: id,
product_id (FK restrict),
customer_id (FK restrict),
sale_id (FK nullable nullOnDelete — verified purchase),
rating (tinyint 1-5),
title (varchar),
comment (text),
images (JSON nullable),
status (enum: pending/approved/rejected),
admin_reply (text nullable),
timestamps

- Only customers with a `delivered` sale for that product can review
- Requires admin approval before showing publicly

---

### 7.2 Wishlist / Save for Later ✅ (Must Fix)

wishlists: id,
customer_id (FK cascade),
product_id (FK cascade),
variant_id (FK nullable nullOnDelete),
timestamps
UNIQUE(customer_id, product_id, variant_id)

---

### 7.3 Coupon / Discount Code Engine ✅ (Should Fix)

**Confirmed:** `starts_at` + `expires_at` = datetime with time (not date only)

coupons: id,
code (varchar unique),
type (enum: percent/fixed),
value (decimal 10,2),
min_order_amount (decimal 10,2 nullable),
max_discount_amount (decimal 10,2 nullable),
usage_limit (int nullable),
usage_limit_per_customer (int nullable),
used_count (int default 0),
applicable_to (enum: all/category/product),
starts_at (datetime),
expires_at (datetime),
coupon_stackable (bool default false),
is_active (bool default true),
created_by (FK users restrict),
timestamps

coupon_usages: id,
coupon_id (FK restrict),
customer_id (FK restrict),
sale_id (FK restrict),
discount_amount (decimal 10,2),
timestamps

**Confirmed stack order:**

- Festival discount → Product discount → Coupon (if `coupon_stackable = true`)
- Admin can toggle coupon on/off per sale
- Coupon section in UI shows: code, type, value, start datetime, end datetime, usage stats, applicable products

---

### 7.4 Festival / Time-Bound Product Discount (Should Fix)

**Confirmed stack order:** Festival/Product discount first → Coupon last (if enabled)

products additions:
discount_starts_at (datetime nullable)
discount_ends_at (datetime nullable)

---

### 7.5 Spinning Wheel — One-time Discount Spin (Should Fix — depends on 7.3)

spin_wheel_attempts: id,
customer_id (FK nullable),
device_fingerprint (varchar),
ip_address (varchar),
prize_won (varchar nullable),
coupon_id (FK coupons nullable),
claimed_at (timestamp),
timestamps

- Logged-in → lock by `customer_id`
- Guest → lock by `device_fingerprint` + `ip_address`
- Win → generates unique single-use coupon

---

### 7.6 Abandoned Cart Recovery (Should Fix — ships with storefront)

- Applies once storefront cart/checkout (11.4/11.5) exists

---

### 7.7 Email/SMS Order Notification Flow (Should Fix)

- `OrderConfirmed`, `OrderShipped`, `OrderDelivered` Laravel Notification classes
- Uses notification_logs table (4.10)

---

### 7.8 Loyalty Points System ✅ (Should Fix)

products additions: loyalty_points (int default 0)

customer_loyalty_points: id,
customer_id (FK unique),
total_earned (int default 0),
total_redeemed (int default 0),
current_balance (int default 0),
timestamps

loyalty_point_transactions: id,
customer_id (FK restrict),
sale_id (FK nullable),
sale_item_id (FK nullable),
type (enum: earned/redeemed/adjusted/expired/reversed),
points (int),
note (text nullable),
created_by (FK users nullable),
timestamps

loyalty_rewards: id,
title (varchar),
points_required (int),
reward_type (enum: discount_coupon/free_shipping/custom),
coupon_id (FK nullable),
is_active (bool default true),
timestamps

business_settings additions:
loyalty_points_enabled (bool default false)
loyalty_points_customer_visible (bool default false)

**Discount-aware calculation:**

effective_price_ratio = final_unit_price / original_sale_price
awarded_points = floor(product.loyalty_points × effective_price_ratio × quantity)

- Points credited on `delivered` status only
- Cancel/Return → points reversed

---

## 8. Order Fulfillment

### 8.1 Order Task / Fulfillment Queue ✅ (Must Fix)

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

**Claim guard (open tasks):**

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
**Permissions:** `order_task.view`, `order_task.create`, `order_task.assign`, `order_task.claim`, `order_task.complete`

---

### 8.2 Staff/Moderator Performance Report (Should Fix — bundled with 8.1)

- Filter: staff/moderator, date range, source, status
- Metrics: total claimed/assigned, total completed, avg completion time, cancelled count

---

### 8.3 Pre-Order / Booking System ✅ (Should Fix)

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

**Permissions:** `pre_order.view`, `pre_order.create`, `pre_order.manage`

---

## 9. Business Financial Visibility

### 9.1 Business Payment Accounts Ledger ✅ (Should Fix)

payment_accounts: id,
method (enum: bkash/nagad/rocket/bank/cash),
account_label (varchar),
account_number (varchar),
bank_name (varchar nullable),
branch_name (varchar nullable),
opening_balance (decimal 10,2 default 0),
is_active (bool default true),
note (text nullable),
timestamps

payment_account_transactions: id,
payment_account_id (FK restrict),
transaction_type (enum: credit/debit),
amount (decimal 10,2),
running_balance (decimal 10,2),
source_type (enum: sale/purchase/expense/withdrawal/manual),
source_id (bigint nullable),
reference (varchar nullable),
note (text nullable),
created_by (FK users restrict),
timestamps

- Dashboard card: live per-channel balance (bKash / Nagad / Bank / Cash)

---

### 9.2 Customer Order/Spending Visibility (Should Fix)

New section on Customer Show page:

- Total Orders, Total Spent (lifetime), Average Order Value, Last Order Date
- Recent Orders table

---

### 9.3 Customer Ledger Opening Balance Fix (Should Fix)

Total Due = opening_balance + all unpaid sale dues − all payments received

Matches the `total_deposited` pattern used in Investment domain.

---

## 10. Customer Accounts / Portal

### 10.1 Website Customers in Backend (Should Fix)

customers additions:
source (enum: backend/website) default: 'backend'
registered_at (timestamp nullable)

---

### 10.2 Secure Portal Access Invite ✅ (Must Fix — security)

No plaintext password emailing.

customers additions:
invited_at (timestamp nullable)
invited_by (FK users nullable nullOnDelete)
password_setup_token (varchar nullable)
password_setup_expires_at (timestamp nullable)

- Admin clicks "Send Portal Access" (optional, any time)
- Customer receives secure expiring link → sets own password

---

### 10.3 Customer Website Registration (Should Fix)

|              | Staff Registration            | Customer Registration            |
| ------------ | ----------------------------- | -------------------------------- |
| Email verify | Mandatory (persistent banner) | Optional (can login immediately) |
| Role         | Admin-assigned                | No backend role                  |

customers additions:
password (varchar nullable)
email_verified_at (timestamp nullable)
remember_token (varchar nullable)

---

## 11. Customer-Facing Storefront ✅

### 11.1 Public Product Catalog (Must Fix)

- Guest-friendly browsing (no login required)
- Slug URLs only — never raw IDs
- Category browse, price/stock/rating filters, pagination

---

### 11.2 Website Settings / CMS ✅ (Must Fix — depends on 1.1)

Super Admin only. Separate from business_settings.

website_settings (cache-backed key-value, same pattern as 1.1):
hero_banners (JSON — [{image, title, link}])
site_tagline
contact_phone, contact_email, contact_address
social_facebook, social_instagram, social_whatsapp
featured_product_ids (JSON)
announcement_text (nullable)
primary_color, secondary_color, accent_color, text_color, bg_color

- Colors injected as CSS custom properties at storefront root
- Changing in Settings updates entire public website instantly

---

### 11.3 Add-to-Cart Animation + Full Responsiveness (Should Fix)

- "Fly to cart" CSS transition animation on add-to-cart
- Fully responsive: mobile/tablet/desktop via Tailwind breakpoints

---

### 11.4 Cart (Must Fix)

- Guest-accessible (no login needed)
- Quantity adjust, remove, subtotal
- Login required only at checkout (11.5)

---

### 11.5 Checkout — Login Required, Manual Payment ✅ (Must Fix)

**Confirmed:** Guest browsing + cart OK. Login required to place order.

**Checkout form:**

- Delivery Address, Phone
- Delivery Type: Inside Dhaka / Outside Dhaka / COD
- Delivery Charge (optional — admin can fill later)
- Payment Method: bKash / Nagad / COD
    - If bKash/Nagad: Transaction ID + Amount Sent + Screenshot Upload
- Customer Note (optional)

sales additions:
source (enum: pos/website) default: pos
customer_note (text nullable)

**Flow:**

1. Customer submits → `payment_status_manual = pending_verification`, stock reserved
2. Appears in Admin Sales History / Order Task list
3. Staff verifies TrxID → stock deducted, order → `confirmed`

---

### 11.6 Manual Payment Verification (Must Fix — bundled with 11.5)

- Reuses `sale_payments` columns from 4.3
- No new schema needed

---

### 11.7 Website Product Search — Premium Style (Should Fix)

- Glassmorphism rounded search bar
- Suggestions dropdown: product image + name + price
- Recent Searches as pills with Clear action
- Same visual pattern as backend Global Search (1.9)

---

### 11.8 Recently Ordered Products — Customer Profile (Should Fix)

- Visual image-card list of previously ordered products
- "Order Again" quick button
- No new table — queried from existing `sale_items` + `customer_id`

---

### 11.9 Customer Profile — Order Tracking (Must Fix)

- Full order history with `sale_status_histories` timeline per order
- "Ordered → Confirmed → Shipped → Delivered"
- Loyalty points balance (if `loyalty_points_customer_visible = true`)
- Wishlist
- Recently Ordered Products (11.8)

---

### 11.10 Reviews & Wishlist — Storefront UI (Should Fix)

- Frontend UI for backend-managed Reviews (7.1) and Wishlist (7.2)

---

### 11.11 SEO (Should Fix)

- Meta tag rendering from `meta_title`/`meta_description` fields
- `sitemap.xml` generation
- Slug-based clean URLs (3.4)

---

### 11.12 Facebook Pixel Integration (Should Fix — bundled with 6.6)

- Standard Meta Pixel + Conversions API (both free)
- Events: ViewContent, AddToCart, Purchase
- Deduplication via `pixel_event_id` (6.6)

---

## 12. Phase 2 — Deferred (Paid Services Only)

| #    | Feature                    | Notes                                                       |
| ---- | -------------------------- | ----------------------------------------------------------- |
| 12.1 | Automated Payment Gateway  | bKash/Nagad/SSLCommerz — replaces manual verification       |
| 12.2 | Courier API Integration    | Pathao/Steadfast — replaces manual fields in 4.6            |
| 12.3 | External Fraud Network API | Enhances Layer 3 via `external_fraud_check_response` column |
| 12.4 | WhatsApp Business API      | Extends notification provider (4.10)                        |

---

## 13. Optional / Future

| #     | Feature                             | Note                                 |
| ----- | ----------------------------------- | ------------------------------------ |
| 13.1  | Supplier Ledger                     | Mirror of Customer Ledger            |
| 13.2  | VAT/Tax Report                      | Consolidated return report           |
| 13.3  | Double-Entry Accounting             | Large scope                          |
| 13.4  | Backup & Restore                    | Recommended regardless               |
| 13.5  | Multi-language (বাংলা/English)      |                                      |
| 13.6  | Custom Report Builder               |                                      |
| 13.7  | Business Analytics/Forecasting      |                                      |
| 13.8  | Multi-Warehouse                     | Only if multiple locations           |
| 13.9  | Customer Segments (VIP/Regular/New) |                                      |
| 13.10 | SLA Alert for Order Tasks           |                                      |
| 13.11 | Task Templates for Order Tasks      |                                      |
| 13.12 | Address Autocomplete                | Explicitly declined — free-text only |

---

## 14. HR Extension (bundled with 2.5)

| #    | Feature                             |
| ---- | ----------------------------------- |
| 14.1 | Attendance / Clock In-Out           |
| 14.2 | Leave Management                    |
| 14.3 | Payroll Generation (PDF via dompdf) |

---

## 15. Sprint Order

Sprint 1 — Foundation & Safety:
1.1 Settings Dynamic Fix
1.5 Cascade Soft-Delete Correction
3.3 Product Variants
3.4 Secure Product Slug
3.5 Inventory Sync + Stock Reservation
5.1 Payment Method Charge Config
5.2 Individual Bank under Bank Transfer

Sprint 2 — Sales/Delivery/Payment Core:
4.1 Order Status Workflow
4.2 Delivery Details
4.3 Multi-Payment (sale_payments)
4.4 POS Payment Type Selection
4.5 COD Delivery + Payment Collection
4.6 Courier Manual Fields
4.7 Sales History Page
4.8 Sale Status History
4.9 Order Confirmation Email

Sprint 3 — Fraud Protection:
6.1 Fraud Flags Core Table
6.2 Layer 1 Form Validation
6.3 Layer 2 IP Order Limit
6.4 Layer 3 Success Ratio Check
6.5 Order-Blocked Popup

Sprint 4 — Fulfillment Ops:
8.1 Order Task System
8.2 Staff Performance Report
8.3 Pre-Order/Booking System
3.8 Product Planning Task Manager

Sprint 5 — Admin Polish:
1.2 Dynamic Navbar Logo
1.3 Admin Panel Theme (per-user)
1.4 Global Trash Bin Page
1.6 Dynamic Notifications
1.7 Split Dashboards
1.8 Live Login Status
1.9 Global Search Ctrl+K
1.10 Audit Trail Viewer UI
1.11 PDF/Print Branding
1.14 Fallback / 404 Pages
2.1 Staff Email Verification Banner
2.2 Default Role Assignment

Sprint 6 — Product/Inventory Extras:
3.1 Product Search Autocomplete
3.2 Products Grid/List Toggle
3.6 Universal Import/Export
3.7 Purchase Return/Damage Tracking

Sprint 7 — Customer Portal Foundation:
10.1 Website Customer Source Flag
10.2 Secure Portal Access Invite
10.3 Customer Registration Auth Columns
9.1 Business Payment Accounts Ledger
9.2 Customer Spending Visibility
9.3 Customer Ledger Opening Balance Fix

Sprint 8 — Storefront Build:
11.1 Public Product Catalog
11.2 Website Settings / CMS
11.3 Add-to-Cart Animation + Responsiveness
11.4 Cart
11.5 Checkout (Login Required, Manual Payment)
11.6 Manual Payment Verification
11.7 Website Product Search Premium
11.8 Recently Ordered Products
11.9 Customer Profile + Order Tracking
11.10 Reviews & Wishlist UI
11.11 SEO
11.12 Facebook Pixel Integration

Sprint 9 — Customer Engagement:
7.1 Product Reviews Backend
7.2 Wishlist Backend
7.3 Coupon / Discount Code Engine
7.4 Festival / Time-Bound Discount
7.5 Spinning Wheel
7.6 Abandoned Cart Recovery
7.7 Email/SMS Notification Flow
7.8 Loyalty Points System

Sprint 10 — Employee/HR:
2.4 Employee/User Profile Page
2.5 Salary/Payroll Domain
14.x Attendance/Leave/Payroll (if wanted)

Sprint 11 — Phase 2 (Paid Services Only):
12.1 Automated Payment Gateway
12.2 Courier API Integration
12.3 External Fraud Network API
12.4 WhatsApp Business API

Sprint 12 — Optional / As-Needed:
Section 13 items as business need arises

---

## 16. Open Questions — All Resolved ✅

| Item | Question                      | Confirmed Answer                                                                                            |
| ---- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 2.1  | Self-registration exists?     | No — Admin creates all staff accounts. Persistent email verification banner after login. Login not blocked. |
| 4.12 | Refund handling?              | Option B — distinct `refund` entry in `sale_payments`                                                       |
| 7.3  | Discount stack order?         | Festival/Product discount first → Coupon last (if `coupon_stackable = true`, admin toggleable per sale)     |
| 4.2  | COD/Delivery charge who pays? | Customer pays — separate line item in total. Admin can set 0 (free delivery flag).                          |

---

## 17. Cross-References to Existing Documentation

- All tables: `id` + `timestamps`, `deleted_at` where soft-deletable, `decimal(10,2)` for money
- `ActivityLogService::log()` on every create/update/delete
- Approval-gated fields: `forceFill()->save()` pattern (PROJECT_RULES.md Rule 66)
- Date/datetime inputs: `AppDateInput`/`AppDateRangeInput` always (Rule 19)
- Mantine: selective only — dates, carousel, tiptap, charts (Rule 11)
- Financial domains stay independent (BUSINESS_RULES.md Section 1)
- No paid services anywhere in Phase 1
