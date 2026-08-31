# Gaps & Recommendations — Part B Later (Sprint 5–12 Future Work)

> Paste this file for Sprint 5+ work.
> Always paste together with: MASTER_CONTEXT + PROJECT_RULES + DATABASE_SCHEMA + BUSINESS_RULES + ARCHITECTURE

---

## AI Usage Notes

- Read all other pasted files before this one.
- ONE item at a time per PROJECT_RULES.md Rule 1.
- No paid/premium services in Phase 1.
- After each item: update MASTER_CONTEXT, CHANGELOG, DATABASE_SCHEMA, BUSINESS_RULES, this file.
- Storefront (Section 10) is a NEW separate frontend — own routes, layout, auth guard, page directory.
  Customer login must NOT share guard/session with staff/admin auth.

## Legend

- ✅ Confirmed by user, ready to build
- 🔜 Deferred (Phase 2 / paid service)
- ⚠️ Needs clarification before building

---

## SPRINT 5 — Admin Polish

### 1.2 Dynamic Navbar Logo | ✅ Done |

```
business_settings keys:
  logo_type: 'image' | 'text'
  logo_image_path
  logo_text_segments: JSON [{ text: "Master", color: "#ffffff" }, { text: "POS", color: "#ef4444" }]
```

- Navbar renders segments as <span style={{color}}>
- Settings page shows live preview
- Also feeds into PDF/Print branding (1.11)

---

### 1.3 Admin Panel Theme — Per-User Personal (Should Fix — depends on 1.1)

> NOT the same as Website Color Palette (10.2). Two separate systems.

|              | Admin Panel Theme                    | Website Color Palette               |
| ------------ | ------------------------------------ | ----------------------------------- |
| Scope        | Personal — each user picks their own | Global — one palette for storefront |
| Who controls | Any logged-in backend user           | Super Admin only                    |
| Effect       | Only that user's backend view        | Every visitor's storefront          |

```
user_preferences: id, user_id (FK unique), theme_json, timestamps
theme_json: { primary_color, bg_image_url, font_family, font_size, mode: 'light'|'dark', border_radius }
```

- Loaded on login, injected as CSS custom properties on <html>
- Also stores Grid/List view preference (3.2)

---

### 1.4 Global Trash Bin Page (Should Fix)

- Single page, module filter dropdown
- deleted_by column added to all soft-deletable tables that don't already track it
- Restore + Force Delete actions

---

### 1.6 Dynamic Notifications — click → detail page (Should Fix)

- notifications.data JSON gets {type, id} or url at creation time
- Frontend click → router.visit()
- No schema change — only notification-creation call sites updated

---

### 1.7 Split Backend Dashboard into Module Dashboards | ✅ Done |

- /dashboard stays as overview (existing)
- New: /dashboard/inventory, /dashboard/investments, /dashboard/sales
- Each its own single-AJAX-call endpoint (per ARCHITECTURE.md Section 8)
- Navbar "Dashboards" becomes a dropdown group

---

### 1.8 Live Login / Active Status ✅ Done

```
users additions: last_seen_at (timestamp nullable)
```

- Middleware updates throttled (once per minute)
- Green dot if last_seen_at within 5 minutes
- dayjs().fromNow() for "active 1h ago" text
- Login History page polls every 30–60s via axios

---

### 1.9 Global Search Ctrl+K — Backend ✅ Done

- Glassmorphism style, scoped to: Products, Customers, Suppliers, Sales (by reference_no), Investments, Partners
- Debounced, keyboard-navigable, category-grouped results
- Suggestions list with icons
- Recent Searches as pills with Clear action
- Ctrl+K shortcut hint inside the box
- Same visual pattern reused for Website Product Search (10.7)

---

### 1.10 Audit Trail Viewer UI ✅ Done

- activity_logs table already exists — only viewer page missing
- Filterable by module / action / user / date range
- Click entry → navigates to subject_type/subject_id

---

### 1.11 PDF/Print Branding | ✅ Done |

- Audited all PDF Blade templates (Invoice, Investor Statement, Partner Statement, Reports)
- logo_image_path canonical key; business_logo fallback; logo_path resolved filesystem path
- file_exists() guard everywhere; dompdf requirement met

---

### 1.12 Navbar Calculator Modal (Nice to Have)

- Pure frontend, global modal at layout level
- No backend needed

---

### 1.13 Full UI Animation + Responsiveness (Standing Rule)

Rule for all future work — not a single feature:

- transition-all duration-200 on all interactive elements
- Modal fade/scale animations
- Table row hover states
- Responsive breakpoints on every new component
- Applies to backend admin panel AND storefront equally

---

### 1.14 Fallback / 404 Pages — 3 Surfaces | ✅ Done |

| Surface             | Layout Used                       |
| ------------------- | --------------------------------- |
| Backend Admin Panel | Admin Panel layout/theme          |
| POS Terminal        | POS layout                        |
| Public Website      | Storefront layout + color palette |

- Message: "Page not found" / "এই পাতাটি খুঁজে পাওয়া যায়নি"
- "Back to Home" button per surface
- No new table needed

---

### 1.15 Navbar App Launcher Popup — Quick Links Grid (Nice to Have)

```
quick_links: id, label, icon (lucide-react icon name), route_name,
  sort_order, is_active,
  visible_to_roles (JSON nullable — null = everyone),
  timestamps
```

UI (grid of icons with labels):

```
┌─────────────────────────────────────┐
│  Quick Links          View All →     │
├─────────────────────────────────────┤
│   🧮        📦        💰            │
│ Calculator  Products  Investments    │
│   👥        📊        🔔            │
│ Customers   Reports   Notifications  │
└─────────────────────────────────────┘
```

- Admin manages list (add/remove/reorder) from Settings
- "View All" opens full searchable module directory page

---

### 1.16 System Status Pages (Should Fix)

```
business_settings additions:
  maintenance_mode_enabled (bool)
  maintenance_message (text)
  coming_soon_mode_enabled (bool)
  coming_soon_message (text)
```

| Page               | Trigger                                                  | Who can still access                            |
| ------------------ | -------------------------------------------------------- | ----------------------------------------------- |
| Maintenance Mode   | maintenance_mode_enabled = true                          | Super Admin only                                |
| Coming Soon        | coming_soon_mode_enabled = true                          | Backend/POS unaffected, only Website shows this |
| 500 (Server Error) | Laravel exception handler — branded per surface          | —                                               |
| Offline            | navigator.onLine + event listeners — dismissable overlay | No backend, all 3 surfaces                      |

---

### 1.17 Privacy Policy & Terms Pages (Should Fix)

```
legal_pages: id,
  type (enum: privacy_policy/terms_conditions),
  title (varchar),
  content (rich text — @mantine/tiptap),
  is_visible (bool default false),
  updated_by (FK users),
  updated_at (timestamp),
  timestamps
```

- Admin edits from Settings sub-page
- is_visible toggle controls footer link + public route
- Hidden pages return 404 overlay if visited directly

---

### 1.18 Dynamic Navbar Badges (Nice to Have)

```
feature_announcements: id,
  label (varchar — e.g. "Pre-Orders"),
  route_name (varchar),
  badge_type (enum: new/hot/beta/custom),
  badge_text (varchar nullable),
  show_until (date),
  is_active (bool),
  timestamps

business_settings additions:
  hot_product_order_threshold (int — for "Hot" badge on Website products)
```

Examples:

- Order Tasks nav → count of pending + claimed tasks
- Pre-Orders nav → count of pending pre-orders
- New feature → "New" pill, auto-expires after show_until date

---

### 1.19 Nested/Collapsible Navigation (Nice to Have)

- Reusable recursive nested-menu component
- Native HTML + Tailwind (no shadcn)
- product_categories already supports parent_id — data model ready
- Used in: Backend sidebar + Website category mega-menu

---

### 1.20 Dark Mode — Two Separate Toggles (Should Fix — bundle with 1.3 and 10.2)

| Surface             | Where                                                                        | Scope                     |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------- |
| Backend Admin Panel | Part of per-user theme (1.3) — theme_json.mode                               | Personal, per staff/admin |
| Public Website      | Session/cookie toggle — localStorage, syncs to customer account if logged in | Personal, per visitor     |

```
customers additions: dark_mode_preference (enum: light/dark/system nullable)
```

---

### 1.21 Universal Image Upload Preview (Should Fix — standing component)

One reusable ImageUploadInput component (Backend) + Website equivalent:

- Instant client-side preview using FileReader (no server round-trip)
- Progress indicator during actual upload
- Circular-crop style for profile photos

Used in:

- Product image upload
- Business logo upload (1.2)
- Profile photo upload (2.4)
- Payment screenshot upload (4.3 / 10.6)
- Review image upload (6.1)

---

### 2.1 Staff Email Verification — Persistent Banner ✅ (Must Fix)

**Confirmed flow:**

- Admin creates all staff accounts manually (no public self-registration)
- After login, staff sees persistent email verification banner
- Banner cannot be permanently dismissed — reappears on profile visit
- Login is NOT blocked — only persistent reminder
- Backend: Admin sees verified/unverified badge per staff on Users page

```
users: email_verified_at already exists in schema — enforce UI layer only
```

---

### 2.2 Default Role Assignment (Must Fix)

```
business_settings: default_registration_role_id
```

- Auto-assigned to new staff accounts created by Admin
- Admin can change individual user role anytime (existing Spatie flow)

---

### 2.3 Optional 2FA — Authenticator App (Nice to Have)

- Fully opt-in, never mandatory
- Any logged-in user can enable from Profile Settings

```
users additions:
  two_factor_secret (encrypted nullable)
  two_factor_enabled_at (timestamp nullable)
  two_factor_recovery_codes (encrypted JSON nullable)
```

- Free library: pragmarx/google2fa-laravel

---

### 2.4 Employee/User Profile Page (Should Fix)

- Capital + Profit summary (if linked Partner)
- Salary/Payroll summary (if employee — see 2.5)
- 2FA toggle (2.3) lives here
- Read-only self-service view

---

### 2.5 Salary / Payroll — Independent Domain (Should Fix)

Per BUSINESS_RULES.md Section 1 — Salary stays independent from Capital and Profit.

```
employee_salaries: id, user_id, amount, pay_date, status, timestamps
```

---

## SPRINT 6 — Product/Inventory Extras

### 3.1 Product Dynamic Search / Autocomplete Backend (Should Fix)

- Debounced ~300ms AJAX endpoint (ProductController::search())
- Shows: thumbnail, name, sale_price, stock_qty, low-stock badge, status

---

### 3.2 Products Grid / List View Toggle (Nice to Have)

- Toggle on Products Index — Grid (image cards) vs List (current table)
- Preference stored in user_preferences (1.3)

---

### 3.6 Universal Import/Export (Should Fix)

**Whitelist (safe):** Products, Categories, Units, Customers, Suppliers, Expense Categories, Payment Methods
**Financial tables:** export only, never import

- maatwebsite/excel Import classes with WithValidation, SkipsOnError
- Preview/dry-run screen before committing rows

---

### 3.7 Purchase Return / Damage-Wastage Tracking (Should Fix)

- Symmetric to Sales Return workflow (4.12) but on supplier side

---

## SPRINT 7 — Customer Portal Foundation

### 9.1 Website Customers in Backend (Should Fix)

```
customers additions:
  source (enum: backend/website) default: 'backend'
  registered_at (timestamp nullable)
```

---

### 9.2 Secure Portal Access Invite ✅ (Must Fix — security)

No plaintext password emailing.

```
customers additions:
  invited_at (timestamp nullable)
  invited_by (FK users nullable nullOnDelete)
  password_setup_token (varchar nullable)
  password_setup_expires_at (timestamp nullable)
```

- Admin clicks "Send Portal Access" (optional, any time)
- Customer receives secure expiring link → sets own password

---

### 9.3 Customer Website Registration (Should Fix)

|              | Staff Registration            | Customer Registration            |
| ------------ | ----------------------------- | -------------------------------- |
| Email verify | Mandatory (persistent banner) | Optional (can login immediately) |
| Role         | Admin-assigned                | No backend role                  |

```
customers additions:
  password (varchar nullable)
  email_verified_at (timestamp nullable)
  remember_token (varchar nullable)
```

---

### 8.1 Business Payment Accounts Ledger ✅ (Should Fix)

```
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
```

- Dashboard card: live per-channel balance

---

### 8.2 Customer Order/Spending Visibility (Should Fix)

New section on Customer Show page:

- Total Orders, Total Spent (lifetime), Average Order Value, Last Order Date, Recent Orders table

---

### 8.3 Customer Ledger Opening Balance Fix (Should Fix)

```
Total Due = opening_balance + all unpaid sale dues − all payments received
```

---

## SPRINT 8 — Storefront Build

> ⚠️ CRITICAL: Storefront is a completely NEW, separate frontend application.
>
> - New route group — public routes, no backend. prefix, no AuthenticatedLayout
> - New Inertia page directory — resources/js/Pages/Website/ (never mixed into Pages/Backend/)
> - New layout component — own header/footer/nav, built to Website Color Palette (10.2)
> - New auth guard — customer login must NOT share guard/session with staff/admin auth
> - Customer account must never reach /backend/\* routes
> - Staff account is NOT automatically a storefront customer

### 10.1 Public Product Catalog (Must Fix)

- Guest-friendly browsing (no login required)
- Slug URLs only — never raw IDs (3.4)
- Category browse, price/stock/rating filters, pagination

---

### 10.2 Website Settings / CMS ✅ (Must Fix — depends on 1.1)

Super Admin only. Separate namespace from business_settings.

```
website_settings (cache-backed key-value):
  hero_banners (JSON — [{image, title, link}])
  site_tagline
  contact_phone, contact_email, contact_address
  social_facebook, social_instagram, social_whatsapp
  featured_product_ids (JSON)
  announcement_text (nullable)
  primary_color, secondary_color, accent_color, text_color, bg_color
```

- Colors injected as CSS custom properties at storefront root
- Dark mode toggle handled separately per 1.20 (visitor's own choice)
- Footer includes Privacy Policy / Terms links when visible (1.17)

---

### 10.3 Add-to-Cart Animation + Full Responsiveness (Should Fix)

- "Fly to cart" CSS transition animation on add-to-cart
- Fully responsive: mobile/tablet/desktop via Tailwind breakpoints

---

### 10.4 Cart (Must Fix)

- Guest-accessible (no login needed)
- Quantity adjust, remove, subtotal
- Login required only at checkout (10.5)

---

### 10.5 Checkout — Login Required, Manual Payment ✅ (Must Fix)

**Confirmed:** Guest browsing + cart OK. Login required to place order.
If guest reaches checkout → prompted to Login or Register (modal or redirect).

**Checkout form:**

- Delivery Address, Phone
- Delivery Type: Inside Dhaka / Outside Dhaka / COD
- Delivery Charge (optional — admin can fill later)
- Payment Method: bKash / Nagad / COD
    - If bKash/Nagad: Transaction ID + Amount Sent + Screenshot Upload
- Customer Note (optional)

```
sales additions:
  source (enum: pos/website) default: pos
  customer_note (text nullable)
```

**Flow:**

1. Customer submits → payment_status_manual = pending_verification, stock reserved (3.5)
2. Appears in Admin Sales History / Order Task list
3. Staff verifies TrxID → stock deducted, order → confirmed

---

### 10.6 Manual Payment Verification (Must Fix — bundled with 10.5)

- Reuses sale_payments columns from 4.3
- No new schema needed

---

### 10.7 Website Product Search — Premium Style (Should Fix)

- Glassmorphism rounded search bar
- Suggestions dropdown: product image + name + price
- Recent Searches as pills with Clear action
- Same visual pattern as backend Global Search (1.9)

---

### 10.8 Recently Ordered Products — Customer Profile (Should Fix)

- Visual image-card list of previously ordered products
- "Order Again" quick button
- No new table — queried from existing sale_items + customer_id

---

### 10.9 Customer Profile — Order Tracking (Must Fix)

- Full order history with sale_status_histories timeline per order
- "Ordered → Confirmed → Shipped → Delivered"
- Loyalty points balance (if loyalty_points_customer_visible = true)
- Wishlist
- Recently Ordered Products (10.8)

---

### 10.10 Reviews & Wishlist — Storefront UI (Should Fix)

- Frontend UI for backend-managed Reviews (6.1) and Wishlist (6.2)

---

### 10.11 SEO (Should Fix)

- Meta tag rendering from meta_title/meta_description fields
- sitemap.xml generation
- Slug-based clean URLs (3.4)

---

### 10.12 Facebook Pixel Integration (Should Fix — bundled with 6.6)

```
sales additions: pixel_event_id (varchar unique nullable)
```

- Standard Meta Pixel + Conversions API (both free)
- Events: ViewContent, AddToCart, Purchase
- Deduplication via pixel_event_id

---

### 10.13 Login — Both Modal AND Dedicated Page (Must Fix — bundled with 9.3/10.5)

- **Modal** — triggered inline mid-flow (guest reaches Checkout → login without losing cart)
- **Dedicated page** (/login, /register) — reachable from navbar
- Both use same backend auth guard/controller (9.3)
- On successful login from modal: cart state preserved, no hard redirect

---

### 10.14 Animated Widgets & Counters (Nice to Have)

- Stat/number widgets animate count-up from 0 when scrolling into view
- requestAnimationFrame-based custom hook or small free library
- Applies: homepage stats, dashboard KPI cards, review/rating counts, loyalty points balance

---

## SPRINT 9 — Customer Engagement

### 6.1 Product Reviews & Ratings ✅ (Must Fix)

```
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
```

- Only customers with a delivered sale for that product can review
- Requires admin approval before showing publicly

---

### 6.2 Wishlist / Save for Later ✅ (Must Fix)

```
wishlists: id,
  customer_id (FK cascade),
  product_id (FK cascade),
  variant_id (FK nullable nullOnDelete),
  timestamps
  UNIQUE(customer_id, product_id, variant_id)
```

---

### 6.3 Coupon / Discount Code Engine ✅ (Should Fix)

**Confirmed:** starts_at + expires_at = datetime with time (not date only)

```
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
```

**Confirmed stack order:** Festival/Product discount first → Coupon last (if coupon_stackable = true)

- Admin can toggle coupon on/off per sale
- Coupon section shows: code, type, value, start datetime, end datetime, usage stats, applicable products

---

### 6.4 Festival / Time-Bound Product Discount (Should Fix)

**Confirmed stack order:** Festival/Product discount first → Coupon last (if enabled)

```
products additions:
  discount_starts_at (datetime nullable)
  discount_ends_at (datetime nullable)
```

---

### 6.5 Spinning Wheel — One-time Discount Spin (Should Fix — depends on 6.3)

```
spin_wheel_attempts: id,
  customer_id (FK nullable),
  device_fingerprint (varchar),
  ip_address (varchar),
  prize_won (varchar nullable),
  coupon_id (FK coupons nullable),
  claimed_at (timestamp),
  timestamps
```

- Logged-in → lock by customer_id
- Guest → lock by device_fingerprint + ip_address
- Win → generates unique single-use coupon

---

### 6.6 Abandoned Cart Recovery (Should Fix — ships with storefront)

- Applies once storefront cart/checkout (10.4/10.5) exists

---

### 6.7 Email/SMS Order Notification Flow (Should Fix)

- OrderConfirmed, OrderShipped, OrderDelivered Laravel Notification classes
- Uses notification_logs table (4.10 in GAPS_PART_B_CORE)

---

### 6.8 Loyalty Points System ✅ (Should Fix)

```
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
```

**Discount-aware calculation:**

```
effective_price_ratio = final_unit_price / original_sale_price
awarded_points = floor(product.loyalty_points × effective_price_ratio × quantity)
```

- Points credited on delivered status only
- Cancel/Return → points reversed

---

## SPRINT 10 — Employee/HR

### 2.4 Employee/User Profile Page (Should Fix)

- Capital + Profit summary (if linked Partner)
- Salary/Payroll summary (if employee)
- 2FA toggle (2.3) lives here

---

### 2.5 Salary / Payroll — Independent Domain (Should Fix)

```
employee_salaries: id, user_id, amount, pay_date, status, timestamps
```

---

### 13. HR Extension (Nice to Have — bundled with 2.5)

| #    | Feature                             |
| ---- | ----------------------------------- |
| 13.1 | Attendance / Clock In-Out           |
| 13.2 | Leave Management                    |
| 13.3 | Payroll Generation (PDF via dompdf) |

---

## SPRINT 11 — Phase 2 (Paid Services Only)

| #    | Feature                    | Notes                                                     |
| ---- | -------------------------- | --------------------------------------------------------- |
| 11.1 | Automated Payment Gateway  | bKash/Nagad/SSLCommerz — replaces manual verification     |
| 11.2 | Courier API Integration    | Pathao/Steadfast — replaces manual fields in 4.6          |
| 11.3 | External Fraud Network API | Enhances Layer 3 via external_fraud_check_response column |
| 11.4 | WhatsApp Business API      | Extends notification provider                             |

---

## SPRINT 12 — Optional / As-Needed

| #     | Feature                             | Note                                 |
| ----- | ----------------------------------- | ------------------------------------ |
| 12.1  | Supplier Ledger                     | Mirror of Customer Ledger            |
| 12.2  | VAT/Tax Report                      | Consolidated return report           |
| 12.3  | Double-Entry Accounting             | Large scope                          |
| 12.4  | Backup & Restore                    | Recommended regardless               |
| 12.5  | Multi-language (বাংলা/English)      |                                      |
| 12.6  | Custom Report Builder               |                                      |
| 12.7  | Business Analytics/Forecasting      |                                      |
| 12.8  | Multi-Warehouse                     | Only if multiple locations           |
| 12.9  | Customer Segments (VIP/Regular/New) |                                      |
| 12.10 | SLA Alert for Order Tasks           |                                      |
| 12.11 | Task Templates for Order Tasks      |                                      |
| 12.12 | Address Autocomplete                | Explicitly declined — free-text only |

---

## Additional Items (Also Relevant for Storefront)

### 4.10 SMS/Email Notification Provider (Should Fix / 🔜 WhatsApp Later)

```
notification_logs: id, sale_id,
  channel (enum: email/sms/whatsapp),
  recipient (varchar),
  message_type (enum: order_confirmation/status_update/voucher),
  status (enum: sent/failed),
  provider_response (text nullable),
  timestamps
```

### 4.11 Order Tracking by Track ID (Should Fix)

- Public lookup page — customer enters reference_no → sees sale_status_histories timeline
- No login required
- Becomes part of customer portal (10.9) once storefront ships

### 4.12 Customer Return/Refund Workflow ✅ (Should Fix)

**Confirmed:** Option B — distinct refund entry in sale_payments.

```
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
```

### 4.13 Guest/Walk-in Checkout Fields — POS Only (Should Fix)

```
sales additions:
  guest_email (varchar nullable)
  guest_phone (varchar nullable)
```

Note: Storefront checkout requires login (10.5) — these are for POS walk-in orders only.

### 5.6 Layer 4 — Facebook Pixel Deduplication (Should Fix — with storefront)

```
sales additions: pixel_event_id (varchar unique nullable)
```

### 5.7 Customer Reliability Score (Nice to Have)

- Informational badge: delivery success %, return rate % on Customer Show page
- Non-blocking, separate from fraud_flags

---

## Cross-References

- All tables: id + timestamps, deleted_at where soft-deletable, decimal(10,2) for money
- ActivityLogService::log() on every create/update/delete
- Approval-gated fields: forceFill()->save() pattern (Rule 66)
- Date/datetime inputs: AppDateInput/AppDateRangeInput always (Rule 19)
- Mantine: selective only — dates, carousel, tiptap, charts (Rule 11)
- Financial domains stay independent (BUSINESS_RULES.md Section 1)
- No paid services in Phase 1

---

## Item 1.20 — Full Dark Mode (deferred from Item 1.3)

Status: Pending
Depends on: Item 1.3 ✅

What needs to be done:

1. All existing pages — replace hardcoded Tailwind colors:
   bg-white → bg-card
   text-gray-800/900 → text-foreground
   text-gray-500/400 → text-muted-foreground
   border-gray-200 → border-border
   bg-gray-50/100 → bg-muted
   hover:bg-gray-50 → hover:bg-muted

2. Table rows: bg-white → bg-card, hover:bg-gray-50 → hover:bg-muted

3. Modal/dialog backgrounds: bg-white → bg-card

4. Input fields: bg-white → bg-input text-foreground

5. Density system: --density-padding apply to tables/cards
   density: compact → 8px padding, comfortable → 12px, spacious → 16px

6. Card style system:
   flat → border-border shadow-none
   bordered → border-border shadow-none (same as flat)
   elevated → shadow-md border-0

7. Sidebar width: already applied via AuthenticatedLayout
   (sidebar_width reads from ui state — done in 1.3)

8. Sidebar behavior 'hover': mouseover expand — needs CSS/JS logic

Files to update (approx 100+):

- All pages under resources/js/Pages/Backend/
- Shared components
- Modal components

### Standing Rule (from Item 1.3)

All NEW files/components must use semantic Tailwind classes:
bg-card, text-foreground, border-border, bg-muted etc
Never hardcode: bg-white, text-gray-800, border-gray-200
