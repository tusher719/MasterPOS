# Changelog — Master Business Suite

---

## [v2.47 — Item 1.9] — Global Search Ctrl+K — 2026-08-29

### New Files (3)

- `app/Http/Controllers/Backend/GlobalSearchController.php`:
  search() — GET /backend/search?q=...; MIN_LENGTH=2, PER_CATEGORY=5;
  6 modules permission-gated: product.view (products), customer.view (customers),
  supplier.view (suppliers), sale.view (sales), investment.view (investments),
  partners.view (partners); each returns {id, title, subtitle, url, type} array;
  empty array returned for queries under 2 chars — no DB hit

- `resources/js/Components/GlobalSearch/GlobalSearchModal.tsx`:
  Debounced search (300ms); category-grouped results with icon headers;
  keyboard navigation (↑↓ arrows + Enter to navigate, Escape to close);
  activeIdx tracks highlighted row across all flattened results;
  Recent Searches: localStorage key mbs_recent_searches, max 8 pills,
  per-pill remove + Clear All; empty state, loading spinner, tip state;
  footer keyboard hint bar; backdrop click closes; z-[100]

- `resources/js/Components/GlobalSearch/index.ts`:
  Barrel export for GlobalSearchModal

### Updated Files (2)

- `routes/web.php`:
  GlobalSearchController import added;
  Route::get('search', ...) added inside backend prefix group
  (name: backend.search) — before delete-preview route

- `resources/js/Layouts/AuthenticatedLayout.tsx`:
  useCallback added to react imports;
  GlobalSearchModal import added;
  searchOpen state + handleSearchOpen useCallback added to InnerLayout;
  Ctrl+K / Cmd+K keyboard listener (useEffect, cleaned up on unmount);
  Search trigger button added to navbar left side — responsive width:
  w-[180px] sm:w-[240px] md:w-[320px] lg:w-[400px];
  Command + Search icons added to lucide imports;
  GlobalSearchModal rendered inside main div below page content

### Bug Fix (1)

- GlobalSearchController: permission names corrected from plural to singular —
  products.view → product.view, customers.view → customer.view,
  suppliers.view → supplier.view (confirmed via tinker Permission::pluck('name'))

### Business Rules Established

- Global search covers 6 modules — only modules the user has permission to view
  are searched; no results from unauthorized modules ever returned
- MIN_LENGTH = 2 chars before any DB query fires
- PER_CATEGORY = 5 results max per module
- Recent searches stored client-side (localStorage) — never sent to server
- Ctrl+K opens modal from anywhere in the backend (layout-level listener)
- Search modal z-index: z-[100] — above all other modals and overlays
- Permission names are singular (product.view not products.view) —
  matches Spatie seeder naming convention used throughout the project

---

## [v2.46 — Item 1.8] — Live Login Status — 2026-08-29

### New Files (1)

- `database/migrations/2026_08_29_000001_add_last_seen_at_to_users_table.php`:
  last_seen_at (timestamp nullable) added to users table — after remember_token column

### New Files (1)

- `app/Http/Middleware/UpdateLastSeen.php`:
  Throttled last_seen_at update — Cache gate (60s TTL) prevents DB write on every request;
  only updates once per minute per authenticated user via forceFill()->save()

### Updated Files (8)

- `bootstrap/app.php`:
  UpdateLastSeen::class appended to web middleware stack (after ValidateSortColumn)

- `config/app.php`:
  timezone changed from 'UTC' → 'Asia/Dhaka' — fixes "6h ago" display issue

- `app/Http/Controllers/Backend/UserController.php`:
  index(): serverNow prop added (now()->toISOString()) for frontend clock reference

- `app/Http/Controllers/Backend/LoginHistoryController.php`:
  with('user:id,name,email') → with('user:id,name,email,last_seen_at') — presence data

- `resources/js/types/user.d.ts`:
  last_seen_at: string | null added to User interface

- `resources/js/Pages/Backend/Users/Index.tsx`:
  Full replace — PresenceAvatar component with presence ring (green/amber/gray);
  getRingClass() static string function (Tailwind purge-safe);
  getLabelClass() for "Active now" / "Xm ago" / "Never" label;
  formatLastSeen() + getPresence() helpers;
  My Theme semantic classes throughout (bg-card, text-foreground, border-border etc.)

- `resources/js/Pages/Backend/LoginHistories/Index.tsx`:
  Full replace — PresenceAvatar with ring; 30s axios polling for live last_seen_at refresh;
  "Live" animated badge in header; Presence legend; same getRingClass() purge-safe pattern;
  My Theme semantic classes throughout

- `resources/js/Components/shared/DataTable.tsx`:
  bg-white → bg-card, border-gray-200 → border-border, divide-gray-_ → divide-border,
  bg-gray-50 → bg-muted/50, hover:bg-gray-50 → hover:bg-muted/40,
  text-gray-_ → text-foreground/text-muted-foreground

- `resources/js/Components/shared/Modal.tsx`:
  bg-white → bg-card, border-gray-_ → border-border,
  text-gray-_ → text-foreground/text-muted-foreground, close button → hover:bg-muted

- `resources/js/Components/shared/ConfirmDeleteModal.tsx`:
  bg-white → bg-card, border-gray-_ → border-border,
  bg-gray-100 → bg-muted, Cancel button → bg-card border-border hover:bg-muted,
  text-gray-_ → text-foreground/text-muted-foreground

- `resources/js/Layouts/AuthenticatedLayout.tsx`:
  NotificationBell: dropdown bg-white → bg-card, border-gray-_ → border-border,
  hover:bg-gray-50 → hover:bg-muted/50, text-gray-_ → text-foreground/muted-foreground;
  UserDropdown: same semantic class pattern throughout

### Business Rules Established

- last_seen_at updated at most once per minute per user (Cache TTL gate)
- Presence thresholds: online = ≤5 min, away = 5–30 min, offline = >30 min
- Ring uses static full-string classes (getRingClass) — never dynamic concatenation (Tailwind purge-safe)
- LoginHistories polls every 30s via axios — silent fail on error (stale data acceptable)
- timezone: Asia/Dhaka — all now() calls produce BD time
- My Theme rule: all new shared components use semantic classes only (bg-card, border-border etc.)

---

## [v2.45 — Item 1.7] — Split Dashboards — 2026-08-29

### New Files (7)

- `app/Http/Controllers/Backend/SalesDashboardController.php`:
  data() — period-aware JSON endpoint; kpis (revenue/count/aov/due/cod with prev-period comparison),
  charts (daily/monthly trend with revenue+count+due), order_status breakdown,
  payment_status breakdown, payment_methods breakdown, delivery_types breakdown,
  top_products (top 10 by revenue with profit), top_customers (top 10 by spend),
  recent_sales (last 15 in period), hourly_trend (≤7 day ranges only)

- `app/Http/Controllers/Backend/InventoryDashboardController.php`:
  data() — period-aware JSON endpoint; kpis (inventory_value/total_sku/active_products/
  out_of_stock/low_stock/category_count — all-time snapshot), low_stock list (20),
  out_of_stock list (20), never_sold list (15), top_moving (qty sold in period),
  slow_moving (least sold in period), by_category (stock value per category),
  stock_movements (recent 20 in period), purchase_trend (daily/monthly)

- `app/Http/Controllers/Backend/InvestmentDashboardController.php`:
  data() — period-aware JSON endpoint; kpis (active_investment/investor_count/
  total_distributed/period_distributed/pending_distributions/total_withdrawn/partner_count),
  capital_summary (per investor from investor_capital_balances with unlock status),
  profit_summary (draft/approved/distributed count + net_profit + distributable in period),
  investments_list (all with type + capital + profit balance joins),
  distributions_list (last 15 in period), capital_trend (credit/debit from ledger),
  distribution_trend (daily/monthly), partner_balances (from partner_profit_balances)

- `resources/js/Pages/Dashboard/_components/SharedComponents.tsx`:
  Exports: PeriodType, PeriodParams, PERIOD_OPTIONS, fmt(), fmtShort(), fmtLabel(),
  ChangeBadge, KpiCard, SectionCard (with optional action slot), SimpleBar,
  StatusBadge, Skeleton (grid-based animated placeholder), ChartTooltipBox,
  PeriodFilter (Today/This Week/This Month/This Year/Custom with date range inputs)

- `resources/js/Pages/Dashboard/_components/SalesTab.tsx`:
  RevenueTrendChart — AreaChart (revenue + due, dual area, gradient fill, daily/monthly);
  OrderStatusChart — horizontal BarChart with per-status color Cell;
  PaymentMethodChart — vertical BarChart with color Cell + legend rows with % share;
  SalesTab — KPI row (4 cards) + trend chart (full width) + 2-col grid (status + methods)
    - 2-col grid (top products + top customers) + recent sales table

- `resources/js/Pages/Dashboard/_components/InventoryTab.tsx`:
  CategoryStockChart — vertical BarChart with per-category color Cell + legend rows;
  TopMovingChart — horizontal BarChart (qty sold) with tooltip (qty+revenue+stock);
  LowStockList — progress bar per product (stock/threshold ratio);
  OutOfStockList — compact list with category + sale price;
  InventoryTab — KPI row (4 cards) + 2-col charts + 2-col lists

- `resources/js/Pages/Dashboard/_components/InvestmentsTab.tsx`:
  DistributionTrendChart — AreaChart (distributed amount, amber gradient);
  CapitalComparisonChart — grouped BarChart (deposited/withdrawn/balance per investor);
  InvestorCapitalCards — per-investor card with 3-col stats + unlock progress bar;
  PartnerBalanceList — per-partner earned/pending bar rows;
  DistributionsTable — period distributions table with status badge;
  InvestmentsTab — KPI row (4 cards) + period summary pills (5 stats) + 2-col charts
    - 2-col (investor cards + partner balances) + distributions table

### Updated Files (3)

- `resources/js/Pages/Dashboard.tsx`:
  Full replace — now a clean hub (tab state + fetch logic only, ~130 lines);
  TABS config array with routeName per tab; fetchData() with URLSearchParams;
  handlePeriodChange() clears current tab data on period switch (shows skeleton);
  tab bar: 3 buttons with active color/bg per tab; Retry button in error state;
  footer link to backend.dashboard.index; imports 3 tab components + SharedComponents

- `routes/web.php`:
  Old plain `/dashboard` route replaced with middleware group containing:
  GET /dashboard → Inertia::render('Dashboard') (name: dashboard),
  GET /dashboard/sales/data → SalesDashboardController@data (name: dashboard.sales.data),
  GET /dashboard/inventory/data → InventoryDashboardController@data (name: dashboard.inventory.data),
  GET /dashboard/investments/data → InvestmentDashboardController@data (name: dashboard.investments.data);
  3 use imports added at top of file

- `resources/js/Layouts/AuthenticatedLayout.tsx`:
  NAV_ITEMS: "Dashboard" + "Backend Dashboard" two separate items replaced with
  "Dashboards" group containing Overview (backend.dashboard.index) +
  Sales & Analytics (dashboard) children

### Business Rules Established

- /dashboard is now a 3-tab hub — Sales / Inventory / Investments
- Each tab fetches its own dedicated JSON endpoint with period params
- Tab change triggers re-fetch; period change clears current tab data first (shows skeleton)
- /backend/dashboard (DashboardController) is completely unchanged — full analytics still there
- SalesDashboardController hourly_trend only computed for ≤7 day ranges (today/this_week)
- InventoryDashboardController kpis are all-time snapshot (not period-filtered) — inventory state doesn't change by period
- InvestmentDashboardController capital_summary reads from investor_capital_balances — includes unlocked_amount/locked_amount columns added in Gap 4.1
- Route names: dashboard.sales.data / dashboard.inventory.data / dashboard.investments.data
  — all under auth+verified middleware, no backend prefix

---

## [v2.44 — Item 1.6] — Dynamic Notifications — 2026-08-27

### Updated Files (10)

- app/Notifications/LowStockNotification.php:
  hardcoded URL `/backend/products/{id}/edit` →
  route('backend.products.edit', $this->productId)

- app/Notifications/NewExpenseNotification.php:
  hardcoded URL `/backend/expenses/{id}` →
  route('backend.expenses.show', $this->expenseId)

- app/Notifications/NewSaleNotification.php:
  url already used route() — confirmed correct ✅

- resources/js/types/index.d.ts:
  PageProps generic <T> removed — replaced with index signature
  [key: string]: unknown for .d.ts compatibility

- resources/js/types/notification.ts:
  url field changed from required string → optional url?: string
  (old notifications may not have url in data JSON)

- resources/js/Layouts/AuthenticatedLayout.tsx:
  NotificationBell: handleNotificationClick() added —
  marks notification as read + router.visit(n.data.url) on row click;
  action buttons wrapped in onClick e.stopPropagation() to prevent
  row click firing on delete/mark-read button press;
  cursor-pointer added when notification has url

- app/Http/Controllers/Backend/NotificationController.php:
  index() already existed — no change needed ✅

- resources/js/Pages/Backend/Notifications/Index.tsx:
  import fixed: @/types/notification (not @/types);
  notification row onClick added — mark read + router.visit(url);
  actions div wrapped in e.stopPropagation()

- app/Http/Middleware/HandleInertiaRequests.php:
  notifications key added to share() —
  unread_count: unreadNotifications()->count(),
  latest: latest 8 notifications mapped with
  id/data/read_at/created_at(diffForHumans())

- routes/web.php:
  GET /backend/notifications route added →
  NotificationController@index (name: notifications.index)

### Business Rules Established

- Notification data.url must always use named Laravel routes —
  never hardcoded paths (APP_URL changes break hardcoded URLs)
- notifications shared globally on every Inertia response via
  HandleInertiaRequests — bell dropdown reads props.notifications
- NotificationController::index() uses notificationList prop name —
  never notifications (would collide with globally shared prop)
- Clicking a notification row marks it as read AND navigates to url
  in a single action — two separate router calls (post + visit)
- Action buttons (mark read, delete) use e.stopPropagation() —
  prevents row click from firing when clicking action buttons
- url is optional in NotificationData — old notifications without
  url still display correctly, just not clickable

---

## [v2.43] — Item 1.3 — Admin Panel Theme Per-User — 2026-08-26

### New Files

- database/migrations/2026_08_25_000001_create_user_preferences_table.php
- app/Models/UserPreference.php
- app/Http/Controllers/Backend/UserPreferenceController.php
- resources/js/Components/ThemeProvider.tsx
- resources/js/hooks/useTheme.ts
- resources/js/Pages/Backend/Settings/\_components/ThemeTab.tsx

### Updated Files

- app/Http/Middleware/HandleInertiaRequests.php
- routes/web.php
- resources/js/types/index.d.ts
- resources/js/Layouts/AuthenticatedLayout.tsx
- resources/js/Pages/Backend/Settings/Index.tsx
- tailwind.config.js
- resources/css/app.css

### Key Changes

- Per-user theme stored in user_preferences table (theme_json + ui_json)
- Dark/Light/System mode toggle — html.dark class
- 9 color presets + custom color picker
- 10 font families with live preview
- Border radius live preview
- Sidebar color, width, behavior settings
- CSS variable system: RGB triplets for Tailwind compatibility
- MantineProvider defaultColorScheme: 'auto'

### Critical Rules Added

- --radius (not --border-radius) for Tailwind rounded-\* compatibility
- --theme-sidebar-_ prefix (not --sidebar-_ — shadcn conflict)
- Triple font override: CSS var + html.style + body.style
- tailwind.config.js: darkMode:'class', colors rgb(var(--X)/<alpha-value>)
- app.css: html/body font-family: var(--font-sans) !important
- Light mode: html.dark removed synchronously in updateTheme before RAF

---

[v2.42 — Item 1.2] — Dynamic Navbar Logo — 2026-08-24

New Migration (1)
2026_08_24_023309_seed_navbar_logo_settings:
logo_type (default: 'text'), logo_image_path (default: null),
logo_text_segments (default: Master+POS JSON array) — all group: business
Backward compat: if business_logo already exists → copied to logo_image_path,
logo_type auto-flipped to 'image'

Updated Files (5)
SettingController.php (uploadLogo):
Checks logo_image_path first then business_logo for old file deletion;
Saves to BOTH logo_image_path (new canonical) AND business_logo
(backward compat for PDF Blade templates using public_path());
Calls SettingsService::invalidate() after upload for immediate cache refresh;
index(): builds logo_image_path_url full URL for settings page preview;
Inertia render key changed from 'settings' to 'pageSettings' to avoid
conflict with globally shared flat settings map

UpdateSettingRequest.php:
business group: business_name changed to 'sometimes|required' to allow
logo-only saves without sending business info fields;
Added logo_type (sometimes|in:image,text,both) and
logo_text_segments (sometimes|nullable|string) validation rules

Settings/Index.tsx:
Props renamed pageSettings → destructured as settings internally;
TabProps interface added for sub-component type safety;
NavbarLogoPreview component: both mode renders image + text side by side;
Display Type selector: 2 buttons → 3 buttons (Image Only / Text Only / Image+Text);
Image hint and Text segment builder conditionally shown for 'both' mode;
logoStyleForm useForm removed → replaced with logoStyleProcessing useState +
window.axios.post() to bypass Inertia useForm transform() void return issue;
submitLogoStyle: saves via axios, reloads page after 800ms so globally shared
settings prop updates navbar without manual cache:clear;
resolveLogoUrl(): checks logo_image_path_url first, then raw path fallback

AuthenticatedLayout.tsx:
NavbarLogo component added (replaces hardcoded business_name span): - logo_type='both' → image + text side by side - logo_type='image' → image only - logo_type='text' → colored text segments - fallback → business_name plain text (indigo-600)
parseSegments() helper extracted (safe JSON parse, returns empty array on fail)
Sidebar header: hardcoded span replaced with <NavbarLogo settings={settings} />

Business Rules Established
logo_image_path is the canonical key for navbar; business_logo kept for PDF compat
logo_type supports three values: image / text / both
both mode: image rendered at max-h-7 max-w-[36px], text segments alongside
Segment limit: max 5, min 1 — remove disabled at 1 segment
Save auto-reloads page after 800ms toast delay — no manual cache:clear needed
pageSettings prop name isolates grouped settings from global flat settings map
window.axios used for logo style save — Inertia useForm.transform() returns void

---

[v2.41 — Item 3.8] — Product Planning Task Manager — 2026-08-24

New Migrations (2)
create_product_planning_tasks_table:
title, note (nullable), status (enum: pending/in_progress/done/cancelled default: pending),
due_date (nullable), created_by (restrict), assigned_to (nullable nullOnDelete),
completed_by (nullable nullOnDelete), completed_at (nullable), timestamps, deleted_at
Indexes: status, due_date, assigned_to

create_product_planning_task_items_table:
task_id (FK cascade), product_id (FK restrict), variant_id (FK nullable nullOnDelete),
quantity (decimal 10,2), unit_cost (decimal 10,2 nullable), note (nullable),
status (enum: pending/ready/cancelled default: pending), timestamps
Indexes: task_id, status

New Files (9)
app/Models/ProductPlanningTask.php:
SoftDeletes; status excluded from $fillable (Rule 66);
isPending/isInProgress/isDone/isCancelled/isTerminal helpers;
scopeByStatus/scopeOverdue scopes;
relations: items/createdBy/assignedTo/completedBy (withTrashed where applicable)

app/Models/ProductPlanningTaskItem.php:
fillable includes status (item-level status is not approval-gated);
getSubtotalAttribute() computed accessor (quantity × unit_cost, null when no cost);
relations: task/product/variant (withTrashed where applicable)

app/Policies/ProductPlanningTaskPolicy.php:
viewAny/create/edit/delete/restore — no model parameter (Rule 3);
restore() reuses delete permission

database/seeders/ProductPlanningTaskSeeder.php:
4 permissions: product_task.view/create/edit/delete;
Admin: all 4; Staff: view only; Moderator: view + create + edit

app/Http/Requests/Backend/StoreProductPlanningTaskRequest.php:
items array min:1 required; per-item product_id/quantity required;
variant_id/unit_cost/note/status nullable

app/Http/Requests/Backend/UpdateProductPlanningTaskRequest.php:
same rules as store + items.\*.id nullable for upsert;
withValidator() terminal status guard — blocks edits on done/cancelled tasks

app/Http/Controllers/Backend/ProductPlanningTaskController.php:
index() — paginated list, search/status/assigned_to/trashed filters, 6-key stats,
relation keys mapped to assigned_to_user/created_by_user/completed_by_user;
store() — creates task + items in DB::transaction(), forceFill status=pending;
update() — upserts items by id (delete removed, update existing, create new);
updateStatus() — terminal guard + same-status guard, forceFill status/completed_at/completed_by;
destroy() — soft delete; restore() — onlyTrashed()->findOrFail() (Rule 2)

resources/js/types/product-planning-task.d.ts:
TaskStatus/TaskItemStatus types; ProductPlanningTask/TaskItem/TaskStats/TaskFilters/
TaskCan/TaskPaginatedData/TaskIndexProps interfaces;
ProductOption/VariantOption for item row dropdowns;
TaskItemFormData/TaskFormData/UpdateStatusFormData

resources/js/types/product-planning-task-colors.ts:
TASK_STATUS_LABELS/COLORS/OPTIONS; TASK_STATUS_FLOW map;
getNextTaskStatuses(current) helper;
TASK_ITEM_STATUS_LABELS/COLORS/OPTIONS

resources/js/Pages/Backend/ProductPlanningTasks/Index.tsx:
6 stat cards (total/pending/in_progress/done/cancelled/overdue);
filter panel: search input + status pills + staff select + trashed toggle;
table: 8 cols (title/status/items/grand_total/due_date/assigned_to/created_by/actions);
actions: update-status (CheckCircle2, hidden for terminal) /
edit (Edit2, hidden for terminal) / delete (XCircle) / restore (RotateCcw);
grand total computed client-side from items array;
pagination

resources/js/Pages/Backend/ProductPlanningTasks/\_components/CreateTaskModal.tsx:
title, note, due_date (AppDateInput), assigned_to select;
dynamic item rows: product select → variant select (shown only when has_variants) →
qty → unit_cost (auto-filled from cost_price/cost_price_override) →
subtotal (read-only computed) → item status → note → remove button;
Add Item button; grand total display; client-side guards before submit

resources/js/Pages/Backend/ProductPlanningTasks/\_components/EditTaskModal.tsx:
useEffect populates from task prop; date slice [0,10] (Rule 6);
item rows carry id for upsert; same fields as create modal;
auto-fill unit_cost from product/variant cost on product/variant change

resources/js/Pages/Backend/ProductPlanningTasks/\_components/UpdateStatusModal.tsx:
current status display; next valid statuses from getNextTaskStatuses() as card selectors;
terminal state notice when no next statuses;
cancellation amber warning banner; optional note textarea;
submit disabled until status selected

Updated Files (3)
routes/web.php:
ProductPlanningTaskController import added;
product-planning-tasks prefix group added after pre-orders group:
restore + update-status declared BEFORE wildcard {productPlanningTask}

app/Providers/AppServiceProvider.php:
ProductPlanningTask + ProductPlanningTaskPolicy imports added;
Gate::policy(ProductPlanningTask::class, ProductPlanningTaskPolicy::class) registered

resources/js/Layouts/AuthenticatedLayout.tsx:
Planning Tasks child added to Fulfillment nav group
(href: backend.product-planning-tasks.index, active: backend.product-planning-tasks.\*)

Bug Fixes (2)
ProductPlanningTaskItem: ProductVariant + Product imports added explicitly —
missing imports caused RelationNotFoundException on eager load

ProductPlanningTaskController index(): relation keys mapped via transform() —
assigned_to_user/created_by_user/completed_by_user added as explicit keys
because Laravel serializes relation names differently from FK column names

Business Rules Established
status excluded from $fillable on ProductPlanningTask — set only via forceFill()->save() (Rule 66)
Terminal statuses (done/cancelled) block all further edits and status changes
item-level status (pending/ready/cancelled) is directly fillable — not approval-gated
update() syncs items via upsert pattern: delete removed IDs, update existing, create new
Grand total computed client-side from items array — not stored in DB
unit_cost auto-filled from product.cost_price or variant.cost_price_override on selection
Moderator role gets product_task.view + create + edit (cannot delete)

---

[v2.40 — Item 8.3] — Pre-Order/Booking System — 2026-08-23

New Migration (1)
create_pre_orders_table:
customer_id (FK nullable nullOnDelete), customer_name_snapshot, customer_phone_snapshot (nullable),
product_id (FK nullable nullOnDelete), product_name_snapshot (nullable),
booking_date (date), expected_delivery_date (date nullable),
total_amount/advance_amount/due_amount (decimal 10,2),
advance_payment_method/transaction_id/payment_proof (nullable),
status (enum: pending/confirmed/ready/delivered/cancelled default: pending),
linked_sale_id (FK sales nullable nullOnDelete),
note, created_by (restrict), updated_by (nullable), timestamps, deleted_at
Indexes: status, booking_date, expected_delivery_date, customer_id

New Files (11)
app/Models/PreOrder.php:
SoftDeletes; status excluded from $fillable (Rule 66);
isPending/isConfirmed/isReady/isDelivered/isCancelled/isTerminal/isConverted helpers;
scopeByStatus/scopeOverdue scopes; recalculateDue() helper;
relations: customer/product/linkedSale/createdBy/updatedBy (all withTrashed where applicable)

app/Policies/PreOrderPolicy.php:
viewAny/create/manage/delete/restore — no model parameter (Rule 3);
manage permission covers edit + status change + convert + delete

database/seeders/PreOrderSeeder.php:
3 permissions: pre_order.view/create/manage;
Admin: all 3; Staff: view only; Moderator: view + create

app/Http/Requests/Backend/StorePreOrderRequest.php:
withValidator() guard: advance_amount cannot exceed total_amount

app/Http/Requests/Backend/UpdatePreOrderRequest.php:
withValidator() guard: same amount check + terminal status block

app/Http/Controllers/Backend/PreOrderController.php:
index() — paginated list, search/status/date_from/date_to/trashed filters, 7-key stats;
store() — proof upload to pre-orders/proofs/, due_amount auto-calc, forceFill status=pending;
update() — replaces old proof file if new uploaded, recalculates due_amount;
updateStatus() — terminal guard + same-status guard, forceFill status, appends note;
convertToSale() — already-converted guard + cancelled guard, forceFill linked_sale_id+status;
destroy() — soft delete; restore() — onlyTrashed()->findOrFail() (Rule 2)

resources/js/types/pre-order.d.ts:
PreOrderStatus type; PreOrder/PreOrderStats/PreOrderFilters/PreOrderCan interfaces;
PreOrderPaginatedData/PreOrderIndexProps; PreOrderFormData/UpdateStatusFormData/ConvertToSaleFormData;
CustomerOption/ProductOption

resources/js/types/pre-order-colors.ts:
PRE_ORDER_STATUS_LABELS/COLORS; PRE_ORDER_STATUS_OPTIONS filter array;
ADVANCE_PAYMENT_METHOD_OPTIONS (cash/bkash/nagad/rocket/bank_transfer/other);
PRE_ORDER_STATUS_FLOW map (terminal states have empty array);
getNextStatuses(current) helper

resources/js/Pages/Backend/PreOrders/Index.tsx:
7 stat cards (total/pending/confirmed/ready/delivered/cancelled/overdue);
filter panel: search input + AppDateRangeInput + status pills + trashed toggle;
table: 9 cols (customer/product/booking_date/delivery_date/total/advance/due/status/actions);
actions: edit (Calendar icon) / update-status (CheckCircle2) / convert (ShoppingCart) / delete (XCircle) / restore (RotateCcw);
convert button hidden when already linked or cancelled;
status + update-status buttons hidden for terminal statuses;
pagination

resources/js/Pages/Backend/PreOrders/\_components/CreatePreOrderModal.tsx:
customer name/phone, product description, booking date (AppDateInput),
expected delivery (AppDateInput with minDate=booking_date), total/advance amounts,
due_amount read-only computed display, payment method select,
transaction_id shown only when method !== cash and method is set, note textarea;
client-side guard: advance ≤ total

resources/js/Pages/Backend/PreOrders/\_components/EditPreOrderModal.tsx:
useEffect populates from preOrder prop; date slice [0,10] (Rule 6);
decimal fields kept as string for inputs; same fields as create modal

resources/js/Pages/Backend/PreOrders/\_components/UpdateStatusModal.tsx:
current status display; next valid statuses from getNextStatuses() as card selectors;
terminal state notice when no next statuses; cancellation amber warning banner;
optional note textarea

resources/js/Pages/Backend/PreOrders/\_components/ConvertToSaleModal.tsx:
pre-order summary card (customer/product/total/advance/due);
sale reference search via fetch() to pos.sales.index with search param;
exact reference_no match from paginated JSON; found sale green confirmation;
"Link & Convert" button disabled until valid sale found

Updated Files (3)
routes/web.php:
PreOrderController import added;
pre-orders prefix group added after order-tasks group:
restore + update-status + convert-to-sale declared BEFORE wildcard {preOrder}

app/Providers/AppServiceProvider.php:
PreOrder + PreOrderPolicy imports added;
Gate::policy(PreOrder::class, PreOrderPolicy::class) registered under Sprint 4 block

resources/js/Layouts/AuthenticatedLayout.tsx:
BookOpen icon imported from lucide-react;
Pre-Orders child added to Fulfillment nav group
(href: backend.pre-orders.index, active: backend.pre-orders.\*)

Business Rules Established
due_amount = total_amount − advance_amount — auto-calculated on every store/update
status excluded from $fillable — set only via forceFill()->save() (Rule 66)
Terminal statuses (delivered/cancelled) block all further edits and status changes
convertToSale() sets linked_sale_id + forceFill status=delivered in one save()
Already-converted pre-orders cannot be linked to another sale
Cancelled pre-orders cannot be converted to sale
ConvertToSaleModal uses fetch() to search sales by reference — no separate API endpoint
advance_payment_proof stored at storage/app/public/pre-orders/proofs/
Old proof file deleted from disk when replaced on update
Moderator role (created in Item 8.1) gets pre_order.view + pre_order.create

---

[v2.39 — Item 8.2] — Staff Performance Report — 2026-08-22

New Files (2)
app/Http/Controllers/Backend/StaffPerformanceReportController.php:
index() — abort_unless order_task.view; filters: user_id/date_from/date_to/source/status;
staffOptions: active non-deleted users; buildPerformanceRows() private method —
loads filtered order_tasks, groups by assigned_to + claimed_by user IDs,
per-user: total_tasks/assigned/claimed/in_progress/completed/cancelled/avg_completion_minutes;
avg time = completed_at - claimed_at (fallback: started_at); sorted by completed desc;
summary: total_tasks/total_completed/total_cancelled/avg across all rows

resources/js/Pages/Backend/OrderTasks/StaffPerformanceReport.tsx:
Props: rows/summary/staffOptions/filters; StatCard component (4 cards);
filter panel (5 controls: staff select, date from/to, source select, status select);
per-staff table with color-coded badges (assigned=blue, claimed=purple,
in_progress=amber, completed=green, cancelled=red); completion rate badge
(green ≥70%, amber ≥40%, red <40%); avg time formatMinutes helper;
tfoot totals row; empty state

Updated Files (2)
routes/web.php: StaffPerformanceReportController import added;
Route::get('/performance', ...) added inside order-tasks prefix group
BEFORE store() POST route (name: order-tasks.performance)

resources/js/Layouts/AuthenticatedLayout.tsx:
Fulfillment nav group: Performance Report child added (icon: TrendingUp,
href: backend.order-tasks.performance);
Order Tasks active pattern fixed: "backend.order-tasks.\*" → "backend.order-tasks.index"
(prevents Performance Report from being highlighted when on Order Tasks page)

Business Rules Established
No new migration — reads from existing order_tasks table only
Permission reused: order_task.view (no new permission needed)
Completed = converted_to_sale OR ready (both terminal positive outcomes)
Avg completion time: completed_at minus claimed_at (preferred), falls back to started_at
Staff who appear as assigned_to OR claimed_by are included in report
Route declared as GET before POST store() inside prefix group — no wildcard conflict

---

[v2.38 — Item 8.1] — Order Task System — 2026-08-21

New Migration (1)
create_order_tasks_table: title, customer_name_snapshot, customer_phone_snapshot,
source (enum), priority (enum), due_date, note, assignment_type (enum),
assigned_to (FK nullable), claimed_by (FK nullable), claimed_at, status (enum),
linked_sale_id (FK nullable), created_by, completed_by, completed_at, started_at,
timestamps, deleted_at

New Files (9)
OrderTask.php: SoftDeletes, fillable excludes claimed_by/claimed_at/status (Rule 66),
isPending/isClaimed/isInProgress/isReady/isConverted/isCancelled/isTerminal/isClaimable helpers,
scopeByStatus/Priority/Source/AssignmentType/AssignedTo/ClaimedBy/Overdue scopes
OrderTaskPolicy.php: viewAny/create/assign/claim/complete/delete — no model param (Rule 3)
OrderTaskSeeder.php: Moderator role created with claim+complete permissions;
Admin all 5 permissions; Staff view only
OrderTaskController.php: index/store/update/assign/claim/updateStatus/convertToSale/destroy;
claim() uses DB::transaction() + lockForUpdate() atomic guard (Rule 66);
tasks manually structured as {data, meta, links} to prevent frontend meta undefined error
order-task.d.ts: OrderTaskSource/Priority/AssignmentType/Status types;
OrderTask/Stats/Filters/Can/StaffOption/FormData interfaces; meta optional
order-task-colors.ts: STATUS/PRIORITY/SOURCE labels+colors; filter option arrays
Index.tsx: stats cards, 3-row filter panel, table with TaskRow component,
safe meta?.last_page pagination; 5 modal integrations
CreateOrderTaskModal.tsx / EditOrderTaskModal.tsx / AssignModal.tsx /
UpdateStatusModal.tsx / ConvertToSaleModal.tsx — \_components/

Updated Files (3)
AppServiceProvider.php: OrderTask + OrderTaskPolicy registered
routes/web.php: order-tasks prefix group, 8 routes, special actions before wildcard
AuthenticatedLayout.tsx: Fulfillment nav group added after Fraud Protection

New Role
Moderator: order_task.view + order_task.claim + order_task.complete

---

[v2.37 — Item 6.5] — Order-Blocked Popup — 2026-08-21

New Files (1)
resources/js/Pages/Backend/POS/\_components/OrderBlockedModal.tsx:
Shown when Layer 2 (IP limit) or Layer 3 (success ratio) blocks checkout;
reads fraud_block_message from usePage().props.settings (globally shared via
HandleInertiaRequests — Item 1.1 pattern);
WhatsApp button shown when fraud_contact_whatsapp non-null (href: wa.me/number);
Call button shown when fraud_contact_phone non-null (href: tel:number);
Facebook/Page button shown when fraud_contact_facebook non-null (href: direct URL);
contact buttons absent when all three settings are null;
fallback Bengali message when fraud_block_message not yet configured by admin;
backdrop click closes modal; z-[80] (above all other POS modals);
lucide-react has no Facebook icon — ExternalLink used instead

Updated Files (1)
resources/js/Pages/Backend/POS/Index.tsx:
OrderBlockedModal import added;
orderBlocked state added (bool, default false);
resetCheckoutState() clears orderBlocked alongside layer1Errors;
handleCheckout() error handler: layer2_blocked OR layer3_blocked on 422
response → setOrderBlocked(true); runs after layer1_errors check, before
standard Laravel validation error handler;
OrderBlockedModal rendered at JSX fragment bottom with isOpen/onClose props

Bug Fix (1)
app/Services/Fraud/Layer2IpOrderLimitService.php line 65:
OrderAttemptLog::scopeRecentByIp(OrderAttemptLog::query(), $ip) — wrong,
  scope cannot be called statically;
  Fixed to: OrderAttemptLog::query()->recentByIp($ip)->count()

Business Rules Established
fraud_block_message, fraud_contact_whatsapp/phone/facebook already seeded
in Item 6.3 migration — no new migration needed for Item 6.5
Admin edits contact values via DB/Tinker in dev phase; Settings UI tab
for fraud config deferred to Sprint 5
OrderBlockedModal shows for both Layer 2 and Layer 3 blocks —
single modal, same message, same contact buttons
Modal does not reveal which layer blocked the order — intentional
(customer-facing message is always the same generic block message)
orderBlocked cleared on every resetCheckoutState() call — includes
cart clear, hold order, and new sale flows

---

[v2.36 — Item 6.4] — Layer 3 Success Ratio Check — 2026-08-19

New Migration (1)
seed_fraud_layer3_settings:
fraud_success_ratio_threshold (int default 60),
fraud_min_orders_before_check (int default 3)
Both seeded into business_settings on up(), deleted on down().

New Files (1)
app/Services/Fraud/Layer3SuccessRatioService.php:
check(phone) — public entry point;
normalizePhone() — strips +88/88 prefix, returns local 01XXXXXXXXX format (same pattern as Layer1/Layer2);
resolveThreshold() — reads fraud_success_ratio_threshold from SettingsService, fallback 60;
resolveMinOrders() — reads fraud_min_orders_before_check from SettingsService, fallback 3;
countTotalOrders() — non-voided sales matched by customer.phone OR delivery_contact_phone;
countDeliveredOrders() — same match condition, filtered by order_status = 'delivered';
ratio computed as: round((delivered / total) \* 100) as integer percent;
block condition: ratio < threshold AND total >= minOrders;
createFraudFlag() — non-fatal (try/catch + Log::warning); sets trigger_type=auto_layer3,
flagged_by=null (system-triggered), status=pending_review via forceFill()->save() (Rule 66)

Updated Files (1)
app/Http/Controllers/Backend/SaleController.php:
Layer3SuccessRatioService import added;
Layer3SuccessRatioService injected in constructor alongside Layer1 + Layer2;
store(): Layer 3 check block added after Layer 2 block, before DB::transaction() —
$this->layer3->check($phoneToCheck) called only when $phoneToCheck !== null;
Layer 3 failure returns JSON {layer3_blocked: true, reason: 'low_success_ratio'} HTTP 422;
Layer 1 failure skips Layer 2 + Layer 3; Layer 2 failure skips Layer 3 only

Business Rules Established
Layer 3 runs only after Layer 1 + Layer 2 both pass
Phone required — no phone = Layer 3 skipped (fail open)
New customers (total orders < min_orders_before_check) always pass Layer 3
Rolling history: all non-voided sales matched by customer.phone OR delivery_contact_phone
Success ratio = delivered_orders / total_orders × 100 (integer percent)
Block condition: ratio < threshold (not <=) — exactly-at-threshold passes
Auto-block creates fraud_flag (trigger_type=auto_layer3, flagged_by=null, status=pending_review)
fraud_flag creation failure is non-fatal — block decision already made before flag write
Threshold configurable: business_settings.fraud_success_ratio_threshold (default 60)
Min orders configurable: business_settings.fraud_min_orders_before_check (default 3)
Layer 3 response shape: {layer3_blocked: true, reason: 'low_success_ratio'} — frontend Item 6.5 reads this

---

[v2.35 — Item 6.3] — Layer 2 IP Order Limit — 2026-08-19
New Migration (1)
create_order_attempt_logs_table:
ip_address (varchar 45 — IPv4 + IPv6), phone (varchar 20 nullable — normalized 01XXXXXXXXX),
attempted_at (timestamp), was_blocked (bool default false), timestamps
Indexes: (ip_address, attempted_at), phone
Also seeds 5 business_settings keys on up():
fraud_ip_order_limit_per_24h (int default 3),
fraud_block_message (Bengali default text — shared with Item 6.5 popup),
fraud_contact_whatsapp / fraud_contact_phone / fraud_contact_facebook (all null — admin fills via Settings)
New Files (2)
app/Models/OrderAttemptLog.php:
fillable (ip_address, phone, attempted_at, was_blocked);
was_blocked cast boolean, attempted_at cast datetime;
scopeRecentByIp() — WHERE ip_address = ? AND attempted_at >= now() - 24h (core Layer 2 query);
scopeBlocked() — WHERE was_blocked = true (future reporting)
app/Services/Fraud/Layer2IpOrderLimitService.php:
check(ip, phone, name, address) — public entry point;
normalizePhone() reused from Layer1ValidationService (no duplication);
flow: log attempt (was_blocked=false) → count IP in 24h window → if count > limit:
update log row was_blocked=true + createFraudFlag() + return blocked result;
resolveLimit() — reads fraud_ip_order_limit_per_24h from SettingsService, fallback 3;
createFraudFlag() — non-fatal (try/catch + Log::warning); sets trigger_type=auto_layer2,
flagged_by=null (system-triggered), status via forceFill()->save() (Rule 66)
Updated Files (1)
app/Http/Controllers/Backend/SaleController.php:
Layer2IpOrderLimitService import + use statement added;
Layer2IpOrderLimitService injected in constructor alongside Layer1ValidationService;
store(): Layer 2 check block added after Layer 1 block, before DB::transaction() —
$this->layer2->check(ip, phone, name, address) called;
Layer 2 failure returns JSON {layer2_blocked: true, reason: 'ip_limit_exceeded'} HTTP 422;
Layer 1 failure still skips Layer 2 entirely (gibberish phone does not consume IP slot)
Business Rules Established
Every checkout attempt (POS + storefront) logged in order_attempt_logs — append-only, never deleted
Layer 2 runs only after Layer 1 passes — Layer 1 failure skips IP logging
Rolling 24-hour window: ip_address = ? AND attempted_at >= now() - 24h
Block condition: count > limit (not >=) — exactly-at-limit attempt passes through
Auto-block creates fraud_flag (trigger_type=auto_layer2, flagged_by=null, status=pending_review)
fraud_flag creation failure is non-fatal — block decision already made before flag write
Limit configurable: business_settings.fraud_ip_order_limit_per_24h (default 3)
fraud_block_message and contact fields seeded here once — shared with Layer 3 (6.4) and block popup (6.5)
Layer 2 response shape: {layer2_blocked: true, reason: 'ip_limit_exceeded'} — frontend Item 6.5 reads this

---

## [v2.34 — Item 6.2] — Layer 1 Form Validation — 2026-08-19

### New Files (1)

- `app/Services/Fraud/Layer1ValidationService.php`:
  validatePhone() — BD format 01[3-9]XXXXXXXX, accepts +88/88 prefix;
  validateName() — rejects purely numeric, no-letter, repeated-char names;
  validateAddress() — minimum 3 words, rejects all-digit/punctuation input;
  validate() — runs all three checks, returns field => error array;
  normalizePhone() — strips +88/88 prefix, returns local 11-digit format

### Updated Files (4)

- `app/Http/Requests/Backend/StoreSaleRequest.php`:
  customer_phone (nullable string max:20) added — carries phone for Layer 1 check;
  customer_name (nullable string max:255) added — walk-in name for Layer 1 check;
  BD format validation deferred to controller via Layer1ValidationService
  (FormRequest only does basic type check)

- `app/Http/Controllers/Backend/SaleController.php`:
  Layer1ValidationService injected in constructor alongside SaleStockService;
  store() — Layer 1 pre-flight check BEFORE DB::transaction() (Rule 18 pattern);
  phone resolved from customer_phone field OR Customer record (registered customer);
  address checked only when delivery_type is non-store_pickup;
  name checked only for walk-in orders (no customer_id);
  Layer 1 failure returns JSON {layer1_errors: {...}} HTTP 422 — sale not created

- `resources/js/Pages/Backend/POS/_components/CheckoutPanel.tsx`:
  layer1Errors: Record<string, string> prop added;
  phone error shown inline under Customer selector (registered customer case);
  Layer 1 error summary block shown above checkout button when errors present —
  bullet list of all field errors; existing UI/props fully preserved

- `resources/js/Pages/Backend/POS/Index.tsx`:
  layer1Errors state added (Record<string, string>, default {});
  resetCheckoutState() clears layer1Errors;
  handleResumeHoldOrder() clears layer1Errors;
  handleCheckout() clears layer1Errors before each attempt;
  handleCheckout() detects data.layer1_errors on 422 → setLayer1Errors() + toast;
  customer_phone passed in payload from selectedCustomer.phone (registered customer);
  CheckoutPanel receives layer1Errors prop (explicit props, no spread)

### Business Rules Established

- Layer 1 runs on every POS checkout attempt — pre-flight, outside DB::transaction()
- Phone validation: 01[3-9]XXXXXXXX format required (Bangladeshi mobile only)
- Name validation: purely numeric, no-letter, and repeated-char names rejected
- Address validation: minimum 3 words, all-digit/punctuation addresses rejected
- Layer 1 failure returns HTTP 422 {layer1_errors: {...}} — never a redirect
- layer1Errors cleared on every new checkout attempt, cart reset, and hold order resume
- Walk-in customer phone not collected in POS UI yet — Sprint 8 storefront will add this
- Layer 1 is free logic only — no paid validation service used

---

## [v2.33 — Item 6.1] — Fraud Flags Core Table — 2026-08-17

### New Migration (1)

- `create_fraud_flags_table`:
  customer_id (FK nullable nullOnDelete), phone (varchar), email (varchar nullable),
  full_name_snapshot (varchar), address_snapshot (text nullable),
  reason (enum: no_answer/refused_delivery/multiple_returns/fake_order/
  failed_validation/ip_limit_exceeded/low_success_ratio/other),
  reason_note (text), trigger_type (enum: manual/auto_layer2/auto_layer3),
  related_sale_ids (JSON nullable), status (enum: pending_review/confirmed_fraud/cleared
  default: pending_review),
  flagged_by (FK users nullable nullOnDelete), flagged_at (timestamp),
  reviewed_by (FK users nullable nullOnDelete), reviewed_at (timestamp nullable),
  review_note (text nullable),
  external_fraud_check_response (JSON nullable — Phase 2 reserved),
  timestamps
  Indexes: phone, email, status, trigger_type, customer_id, flagged_at

### New Files (9)

- `FraudFlag.php`: fillable excludes status/reviewed_by/reviewed_at/review_note
  (Rule 66); confirmFraud() + clearFlag() model methods via forceFill()->save();
  is_pending/is_confirmed/is_cleared accessors; scopes: pendingReview(),
  confirmedFraud(), cleared(), byPhone(), byTriggerType()

- `FraudFlagPolicy.php`: viewAny (flag OR review permission), flag(), review();
  no model parameter on any method (Rule 3 pattern)

- `FraudFlagSeeder.php`: fraud.flag + fraud.review permissions created;
  Admin role gets both; Fraud Manager role created with both permissions;
  Staff gets no fraud permissions

- `FraudFlagController.php`: index() — paginated list with search/status/
  trigger_type/reason filters, stats aggregation, append() for accessors;
  store() — manual flag creation, customer snapshot resolution;
  review() — confirm or clear, same-status guard, forceFill via model methods

- `StoreFraudFlagRequest.php`: customer_id nullable exists, phone required,
  reason enum validation, reason_note min:10, related_sale_ids array

- `ReviewFraudFlagRequest.php`: action in:confirm/clear, review_note min:10

- `resources/js/types/fraud-flag.d.ts`: FraudFlagReason, FraudFlagTriggerType,
  FraudFlagStatus types; FraudFlag, FraudFlagStats, FraudFlagFilters,
  FraudFlagCan interfaces; StoreFraudFlagFormData, ReviewFraudFlagFormData,
  FraudFlagIndexProps

- `resources/js/types/fraud-flag-colors.ts`: FRAUD_FLAG_STATUS_LABELS/COLORS,
  FRAUD_FLAG_TRIGGER_LABELS/COLORS, FRAUD_FLAG_REASON_LABELS,
  STATUS/TRIGGER/REASON filter options arrays

- `resources/js/Pages/Backend/FraudFlags/Index.tsx`: stats cards (Total/Pending/
  Confirmed/Cleared), search + status/trigger/reason filters, table with
  customer info/reason/trigger badge/status badge/flagged_at/flagged_by columns;
  ReviewModal (Confirm Fraud / Clear Flag with mandatory note);
  CreateFlagModal (manual flag creation); can.flag + can.review gated actions

### Updated Files (4)

- `AppServiceProvider.php`: FraudFlag + FraudFlagPolicy imports added;
  Gate::policy(FraudFlag::class, FraudFlagPolicy::class) registered under
  Sprint 3 comment block

- `routes/web.php`: FraudFlagController import added; fraud-flags prefix group
  added before delete-preview route — index (GET), store (POST),
  review (POST /{fraudFlag}/review)

- `AuthenticatedLayout.tsx`: ShieldAlert import confirmed present; Fraud Protection
  nav group added after Partners, before Reports — single child: Fraud Flags

- `FraudFlagController.php`: append(['is_pending', 'is_confirmed', 'is_cleared'])
  added after paginate() — fixes accessor serialization bug (Rule 17 pattern)

### Business Rules Established

- System creates pending_review flags only — auto_layer2/auto_layer3 triggers
  will set flagged_by = null (null = system-triggered)
- Admin / Fraud Manager reviews flags: confirm → confirmed_fraud, clear → cleared
- Already-reviewed flags (non-pending) cannot be re-reviewed — backend guard
- status, reviewed_by, reviewed_at, review_note excluded from $fillable —
  set only via confirmFraud() / clearFlag() model methods (Rule 66)
- Accessors (is_pending, is_confirmed, is_cleared) must be explicitly appended
  via ->append() after paginate() — never auto-serialized by Laravel
- external_fraud_check_response column reserved for Phase 2 paid external API —
  never written in Phase 1
- Fraud Manager is a new role — distinct from Admin and Staff

---

## [v2.32 — Item 4.9] — Order Confirmation Email — 2026-08-16

### New Migration (1)

- `add_email_sent_at_to_sales_table`:
  email_sent_at (timestamp nullable) — after note column

### New Files (2)

- `app/Mail/OrderConfirmationMail.php`: Mailable class — envelope subject
  includes reference_no; content renders emails.order-confirmation view;
  passes sale + business profile array

- `resources/views/emails/order-confirmation.blade.php`: HTML email template —
  header (indigo bg, business name), order details info card (reference_no,
  date, payment type, method, transaction_id, delivery address), items table
  (product name + variant attributes, qty, unit price, subtotal), totals
  breakdown (subtotal, discount, tax, delivery charge, grand total),
  payment status badge (COD/paid/partial/due), note section, footer with
  business address; inline CSS only (email client compatibility)

### Updated Files (4)

- `Sale.php`: email_sent_at added to $fillable

- `StoreSaleRequest.php`: send_email_confirmation (nullable, boolean) added
  to validation rules

- `SaleController.php`: OrderConfirmationMail + Mail imports added;
  store() calls sendOrderConfirmationEmail() AFTER DB transaction completes —
  mail failure never rolls back a completed sale; sendOrderConfirmationEmail()
  private helper added — loadMissing relations, Mail::to()->send(), updates
  email_sent_at on success, logs warning on failure without throwing

- `CheckoutPanel.tsx`: sendEmailConfirmation, onSendEmailConfirmationChange,
  selectedCustomerEmail props added; email confirmation checkbox rendered
  between Note textarea and Checkout button — only visible when selected
  customer has an email address; shows customer email address as hint text

- `Index.tsx`: sendEmailConfirmation state added (default false);
  resetCheckoutState() resets to false; send_email_confirmation included
  in checkout payload; selectedCustomerEmail + callback props passed to
  CheckoutPanel

### Business Rules Established

- Email opt-in only — checkbox shown only when customer has an email address;
  walk-in customers and customers without email never see the checkbox
- send_email_confirmation = false (unchecked) → no email sent regardless
- Email sent AFTER DB transaction — mail failure never affects sale record
- email_sent_at filled on successful send only — null means not sent or failed
- Mail failure logged as warning (Log::warning) — sale remains complete
- MAIL_FROM_NAME must be set as literal string in .env on Windows —
  ${APP_NAME} variable interpolation unreliable on Windows environments

---

## [v2.31 — Item 4.8] — Sale Status History UI — 2026-08-16

### New Files (3)

- `UpdateOrderStatusRequest.php`: validates order_status
  (required, in:processing/confirmed/out_for_delivery/delivered/cancelled/returned)
  and note (required, min:3, max:500); custom messages for both fields

- `UpdateOrderStatusModal.tsx` (`_components/`): individual order status update
  modal; 2-col grid of status cards — current status disabled with "current" badge;
  cancelled/returned show amber warning (stock not auto-reversed);
  mandatory reason textarea (min 3 chars); preview line shows new status badge;
  submit disabled when no change or submitting; router.post to
  backend.pos.sales.update-order-status; z-50

- `StatusHistoryTimeline.tsx` (`_components/`): vertical timeline component;
  most recent entry has indigo dot, older entries gray dot; each entry shows
  StatusBadge (from ORDER_STATUS_OPTIONS) + formatted datetime + note text +
  changed_by user name; formatDateTime() helper (en-GB locale, 12hr);
  fallback badge for unknown status values; empty state when no history

### Updated Files (4)

- `SaleController.php`: updateOrderStatus() method added — trashed guard,
  same-status guard, forceFill order_status, SaleStatusHistory::create(),
  ActivityLogService::log(); show() now eager loads statusHistories.changedBy;
  show() can array extended with updateStatus key (Gate::allows create);
  UpdateOrderStatusRequest import added

- `Sale.php`: statusHistories() HasMany relation added — orderByDesc('created_at');
  SaleStatusHistory import added

- `routes/web.php`: POST sales/{sale}/update-order-status route added after
  delivery-slip route, before resource wildcard;
  name: pos.sales.update-order-status

- `Sales/Show.tsx`: full rebuild — lg:grid-cols-3 layout (main col + sidebar);
  Items table with variant attributes display; Payment History section (inline,
  no modal — reads from sale_payments prop); Status History Timeline section
  (entry count badge in header); Update Status button in page header
  (indigo-50, RefreshCw icon, hidden for voided sales); Order Status sidebar
  card; Payment Summary sidebar with delivery charge line; Customer sidebar;
  Delivery Info sidebar (conditional); Courier Info sidebar (conditional);
  Sale Info sidebar; Delivery Slip link in header (non-store_pickup only);
  sale_date timestamp sliced to [0,10] for clean display;
  UpdateOrderStatusModal rendered at fragment bottom

### Business Rules Established

- payment_type is immutable after sale creation — records original intent
  (half_paid, full_paid, COD); payment_status is the live financial truth
  (auto-calculated); both coexist independently
- Individual status update requires mandatory note — no silent status changes
- cancelled/returned via individual update does NOT auto-reverse stock —
  admin must handle separately; amber warning shown in modal
- delivery_type null on pre-Item-4.2 sales is expected behavior — not a bug
- StatusHistoryTimeline most recent entry = indigo dot (top); older = gray dot
- Show.tsx sidebar pattern: lg:grid-cols-3, main lg:col-span-2, sidebar 1 col

---

## [v2.30 — Item 4.7] — Sales History Page — 2026-08-16

### New Migration (1)

- `create_sale_status_histories_table`:
  sale_id (FK cascade), status (varchar), note (text nullable),
  changed_by (FK users nullable nullOnDelete), timestamps
  Index: sale_id

### New Files (7)

- `SaleStatusHistory.php`: fillable (sale_id, status, note, changed_by);
  sale() BelongsTo, changedBy() BelongsTo withTrashed()

- `StoreAdditionalPaymentRequest.php`: validates amount (required, min:0.01),
  payment_method_id (required, exists), payment_method_bank_id (nullable),
  payment_charge (nullable), transaction_id, payment_reference, payment_date
  (required), note (nullable)

- `AddPaymentModal.tsx` (`_components/`): add additional payment to any sale;
  amount pre-filled with due_amount; method select + bank sub-list for
  bank_transfer; charge auto-calc (mirrors COD collect logic); transaction_id
  for mobile_banking; payment_reference for bank_transfer; remaining-after
  hint; z-[70] (above PaymentHistoryModal); router.post to add-payment route

- `PaymentHistoryModal.tsx` (`_components/`): view all sale_payments for a
  sale; 3-col summary bar (Grand Total / Total Paid / Due); payment entry
  cards with amount, charge, method, bank, date, TxID, verified_by, note;
  status badge (verified/pending/rejected); Add Payment button shown only
  when due_amount > 0 AND canAddPayment; opens AddPaymentModal at z-[70];
  z-[60]

- `BulkStatusModal.tsx` (`_components/`): bulk order_status update for
  selected sales; only confirmed + out_for_delivery allowed in bulk (card
  radio selector); cancelled/returned/delivered blocked (require individual
  action); router.post to bulk-status-update route; z-50

- `delivery-slip.blade.php` (`resources/views/pdf/`): A5 portrait courier-
  friendly PDF; shows customer name/phone/address, items (name + qty only,
  no financial details), courier info, delivery type/charge, receiver
  signature box; COD badge when payment_type = cash_on_delivery; DejaVu Sans,
  flexbox only (no CSS Grid); logo via public_path()

### Updated Files (5)

- `SaleController.php`: SaleStatusHistory import added; addPayment() — creates
  verified SalePayment, calls recalculatePaymentStatus(), activity log;
  bulkStatusUpdate() — only confirmed/out_for_delivery allowed, forceFill per
  sale, SaleStatusHistory per sale, single activity log; deliverySlip() — A5
  PDF via dompdf, loads customer/items/variants, guards trashed; salesList()
  query now eager loads salePayments.paymentMethod, salePayments.paymentMethod
  Bank, salePayments.verifiedBy; store() now creates initial SaleStatusHistory
  (status: processing); collectCodPayment() now creates SaleStatusHistory
  (status: delivered); mapPaymentMethods() private helper extracted (DRY —
  used in index() + salesList()); resolveBusinessProfile() private helper
  extracted (DRY — used in deliverySlip())

- `routes/web.php`: three new routes added inside pos prefix group, declared
  BEFORE resource wildcard routes: POST sales/bulk-status-update (name:
  pos.sales.bulk-status-update), POST sales/{sale}/add-payment (name:
  pos.sales.add-payment), GET sales/{sale}/delivery-slip (name:
  pos.sales.delivery-slip)

- `Sales/Index.tsx`: SalePayment interface added and exported; PaymentMethod
    - PaymentMethodBank interfaces exported (moved from SaleTable.tsx local);
      sale_payments?: SalePayment[] added to Sale interface; filter/badge/option
      constants unchanged

- `Sales/_components/SaleTable.tsx`: PaymentMethod imported from Index instead
  of locally defined; Wallet icon + FileText icon added; PaymentHistoryModal +
  BulkStatusModal imports added; loadingPayments state removed (no longer
  needed); handleOpenPaymentHistory simplified — sets paymentHistorySale
  directly from sale prop (sale_payments now in props); checkbox column +
  select-all logic added; bulk action bar added above table; Payment History
  button (Wallet icon) added to actions; Delivery Slip link (FileText icon,
  opens in new tab) added for non-store_pickup sales; PaymentHistoryModal +
  BulkStatusModal rendered at fragment bottom

### Business Rules Established

- sale_status_histories written on: sale creation (processing), COD payment
  collection (delivered), bulk status update (per sale), individual status
  change (Item 4.8)
- Bulk status update: only confirmed + out_for_delivery allowed — cancelled/
  returned/delivered require per-sale individual action for stock reverse
  and audit trail integrity
- Payment History modal Add Payment button hidden when due_amount = 0 (fully
  paid sales cannot receive additional payments via this flow)
- Delivery Slip PDF shows NO financial details — courier-safe (no unit cost,
  no grand total breakdown)
- sale_payments eager loaded in salesList() — no fetch() call needed in
  frontend; PaymentHistoryModal receives data directly from Inertia props
- SaleController private helpers: mapPaymentMethods() + resolveBusinessProfile()
  extracted to eliminate duplication across index/salesList/deliverySlip

---

## [v2.29 — Item 4.6] — Courier Manual Fields — 2026-08-15

### New Migration (1)

- `add_courier_fields_to_sales_table`:
  courier_provider (varchar nullable),
  courier_tracking_id (varchar nullable),
  courier_status (enum: pending/picked_up/in_transit/delivered/returned/walk_in nullable),
  courier_note (varchar nullable) — all after delivery_status column

### New Files (2)

- `UpdateCourierRequest.php`: courier_provider + courier_status required when
  delivery_type is inside_dhaka/outside_dhaka/parallel; courier_tracking_id
    - courier_note always optional; store_pickup makes all fields optional

- `CourierModal.tsx`: add/edit modal — courier_provider input, tracking_id input,
  courier_status select (6 options), courier_note textarea; isRequired computed
  from delivery_type; isEdit detected from existing courier_provider/status;
  walk_in auto-selected for store_pickup when no status set; backdrop click closes;
  client-side guard before submit; router.post to backend.pos.sales.update-courier

### Updated Files (5)

- `Sale.php`: courier_provider/tracking_id/status/note added to $fillable;
  hasCourierInfo() helper; courierEditable() helper; scopeByCourierStatus() scope

- `SaleController.php`: UpdateCourierRequest import added; updateCourier() method
  added — trashed guard, forceFill courier fields, activity log;
  salesList() filters array + query block updated with courier_status filter

- `routes/web.php`: POST sales/{sale}/update-courier route added after
  collect-cod-payment route — name: pos.sales.update-courier

- `Sales/Index.tsx`: CourierStatus type exported; courier fields added to Sale
  interface; courier_status added to Filters interface; COURIER_STATUS_OPTIONS
  const exported (6 options); courier_status added to hasFilters; Row 4 filter
  panel added for courier status button group

- `SaleTable.tsx`: Truck icon imported; CourierModal import added;
  courierSale state added; CourierStatusBadge component added; Courier th/td
  added to table; Truck button in actions cell (non-store_pickup, non-voided only);
  CourierModal rendered at bottom of fragment

### Bug Fix (1)

- `SalePayment.php`: paymentMethodBank() relation — withTrashed() removed;
  PaymentMethodBank has no SoftDeletes, calling withTrashed() caused
  RelationNotFoundException on Sale show page

### Business Rules Established

- courier_provider + courier_status required when delivery_type is
  inside_dhaka/outside_dhaka/parallel; always optional for store_pickup
- courier_tracking_id always optional regardless of delivery type
- walk_in status auto-suggested for store_pickup orders
- Courier info editable any time while sale is not voided
- Truck icon button shown for all non-store_pickup, non-voided sales
- courier_status filter added to Sales History — independent of other filters
- COD "Collect" button intentionally COD-only — Half Paid due collection
  handled in Item 4.7 via Payment History modal

---

## [v2.28 — Item 4.5] — COD Delivery + Payment Collection — 2026-08-14

### Updated Files (3)

- `SaleController.php`: collectCodPayment() method added — guards (COD check,
  already-delivered check), validates amount/method/date, creates verified
  SalePayment entry, forceFill delivery_status+order_status = delivered,
  calls recalculatePaymentStatus(), activity log; salesList() now passes
  paymentMethods prop to Inertia render; getPaymentMethods() unused method
  removed

- `Pages/Backend/POS/Sales/_components/SaleTable.tsx`: CollectCodPaymentModal
  import added; PaymentMethod/PaymentMethodBank interfaces added; isCodCollectable()
  helper (payment_type=COD AND delivery_status≠delivered AND not voided);
  "Collect" button shown for eligible rows (can.create gated); paymentMethods
  prop added to Props

- `Pages/Backend/POS/Sales/_components/CollectCodPaymentModal.tsx`: new file —
  amount (pre-filled with due_amount), payment method select, bank sub-list
  for bank_transfer, charge display (method-level + bank-level), transaction_id
  for mobile_banking, payment_reference for bank_transfer, collection_date,
  note; partial collection allowed with remaining-due hint; router.post to
  backend.pos.sales.collect-cod-payment

- `Pages/Backend/POS/Sales/Index.tsx`: PaymentMethodBank + PaymentMethod
  interfaces added (before Props); paymentMethods: PaymentMethod[] added to
  Props; paymentMethods destructured in component; passed to SaleTable

### Route Fix

- `routes/web.php`: collect-cod-payment route name corrected from
  `sales.collect-cod-payment` to `pos.sales.collect-cod-payment` —
  full Ziggy name: backend.pos.sales.collect-cod-payment
- Required: php artisan route:cache && php artisan ziggy:generate after fix

### Business Rules Established

- COD payment collection = single combined action: delivery_status → delivered,
  order_status → delivered, SalePayment created (verified immediately),
  recalculatePaymentStatus() syncs paid_amount/due_amount/payment_status
- Partial collection allowed — customer can pay less than due_amount
- "Collect" button visible only when: payment_type=COD AND
  delivery_status≠delivered AND not voided AND can.create=true
- Already-delivered guard on backend prevents duplicate collection (idempotency)
- payment_charge stored on SalePayment row — not on sales table
- bank_transfer: charge at bank level; mobile_banking: charge at method level

---

## [v2.27 — Item 4.4] — POS Payment Type Selection — 2026-08-14

### Updated Files (3)

- `SaleController.php`:
    - index(): paymentMethods now mapped explicitly — type, charge_enabled,
      online_charge_type, online_charge_value, charge_label, banks[] (active only)
      all included; previously raw Eloquent model passed, frontend missing type field
    - store(): return type changed JsonResponse (was RedirectResponse) —
      POS uses axios.post(), must return response()->json([id, reference_no]);
      COD guard added — $isCOD forces paid_amount=0, skips SalePayment row creation;
      payment_type persisted from request; payment_method_id forced null for COD

- `Pages/Backend/POS/Index.tsx`:
    - PaymentMethodBank interface added (id, bank_name, account_number, account_name,
      charge_type, charge_value, charge_enabled, charge_label, is_active)
    - PaymentMethod interface extended with type, charge_enabled, online_charge_type,
      online_charge_value, charge_label, banks: PaymentMethodBank[]
    - PaymentType type alias exported: 'full_paid' | 'half_paid' | 'cash_on_delivery'
    - calcMethodCharge() + calcBankCharge() helper functions — mirror backend calculateCharge()
    - New state: paymentType, paymentMethodBankId, paymentCharge, transactionId, paymentReference
    - handlePaymentMethodChange(): bank reset + charge recalc on method change
    - handleBankChange(): bank-level charge applied on bank select
    - useEffect: charge auto-recalculates when subtotal/discount/tax change
    - handlePaymentTypeChange(): COD → paid=0/method reset; full_paid → grandTotal auto-fill
    - useEffect: full_paid keeps paidAmount synced to grandTotal on cart changes
    - resetCheckoutState() helper extracted — used in clearCart, holdOrder, newSale
    - handleCheckout(): paymentType required guard, COD guard, full payload including
      payment_method_bank_id, payment_charge, transaction_id, payment_reference

- `Pages/Backend/POS/_components/CheckoutPanel.tsx`:
    - Payment Type 3-button segmented selector (Full Paid / Half Paid / COD)
      color-coded: green=full, amber=half, indigo=COD
    - Payment Method select hidden when COD selected
    - Bank sub-list shown when bank_transfer method selected — active banks only,
      per-bank charge badge shown inline
    - Transaction ID field shown for mobile_banking type methods
    - Payment Reference field shown for bank_transfer type methods
    - Totals breakdown: Payment Charge line added (amber, shows charge label)
    - Paid Amount section + Due Amount hidden for COD
    - COD notice banner shown instead (indigo-50 bg)
    - Payment Status badge shows "COD" for cash_on_delivery
    - Checkout button disabled when paymentType is null

### Business Rules Established

- payment_type is required before checkout — frontend blocks submit, backend validates
- COD: paid_amount = 0, no SalePayment row at creation — row added in Item 4.5 on delivery
- payment_charge base = subtotal − discount + tax (before charge) — consistent with backend
- bank_transfer charge applied at bank level, not method level
- mobile_banking → transaction_id field; bank_transfer → payment_reference field
- SaleController store() always returns JSON — never redirect() from POS endpoint
- paymentMethods must be explicitly mapped in index() — never pass raw Eloquent collection

---

## [v2.26 — Item 4.3] — Multi-Payment (sale_payments) — 2026-08-01

### New Migration (1)

- `create_sale_payments_table`:
  sale_id (FK cascade), payment_method_id (FK nullable nullOnDelete),
  payment_method_bank_id (FK nullable nullOnDelete), amount decimal(10,2),
  payment_charge decimal(10,2 default 0), payment_date (date),
  reference (varchar nullable), note (text nullable),
  payment_proof_image (varchar nullable),
  payment_status_manual enum(pending_verification/verified/rejected default: verified),
  transaction_id (varchar nullable),
  verified_by (FK nullable nullOnDelete), verified_at (timestamp nullable),
  created_by (FK restrict), timestamps
  Indexes: sale_id, payment_date, payment_status_manual

### New Files (1)

- `SalePayment.php`: fillable, casts, relations (sale, paymentMethod, paymentMethodBank,
  verifiedBy, creator — all withTrashed where applicable), scopeVerified(),
  scopePendingVerification(), isVerified(), isPendingVerification(), isRejected(),
  totalWithCharge() helpers

### Updated Files (3)

- `Sale.php`: salePayments() HasMany relation added (ordered by payment_date, id);
  recalculatePaymentStatus() method added — sums verified payments, updates
  paid_amount/due_amount/payment_status via forceFill()->save()

- `SaleController.php`:
    - store(): SalePayment import added; initial payment entry created when paid_amount > 0
      (payment_status_manual = 'verified', verified_by = Auth::id(), verified_at = now());
      recalculatePaymentStatus() called after insert; payment_charge logged in activity log;
      paymentMethods now loaded with banks() relation for POS bank_transfer support
    - show(): salePayments.paymentMethod, salePayments.paymentMethodBank,
      salePayments.verifiedBy eager loaded
    - payment_charge, payment_method_bank_id, payment_reference, transaction_id
      fields passed through from request to SalePayment::create()

- `StoreSaleRequest.php`: 4 new payment fields added —
  payment_method_bank_id (nullable, exists:payment_method_banks),
  payment_charge (nullable, numeric, min:0),
  payment_reference (nullable, string, max:100),
  transaction_id (nullable, string, max:100)

### Business Rules Established

- sale_payments is authoritative — sales.paid_amount derived from verified payments only
- recalculatePaymentStatus() is the single authority for payment sync — never bypass
- POS payments verified immediately; storefront payments pending_verification (Item 10.6)
- payment_charge stored per payment entry on sale_payments, not on sales table
- COD sales: no payment row at creation, paid_amount = 0
- payment_method_bank_id set only when method type = bank_transfer

---

## [v2.25 — Item 4.2] — Delivery Details — 2026-08-01

### New Migration (1)

- `add_delivery_columns_to_sales_table`:
  delivery_type enum(store_pickup/inside_dhaka/outside_dhaka/parallel nullable),
  delivery_charge decimal(10,2) nullable default 0,
  delivery_charge_free bool default false,
  delivery_address text nullable,
  delivery_contact_phone varchar nullable,
  delivery_status enum(pending/dispatched/delivered/failed nullable)

### Updated Files (4)

- `Sale.php`: delivery fields added to $fillable; delivery_charge cast decimal:2,
  delivery_charge_free cast boolean; requiresDelivery() helper — true for non-store_pickup types;
  effectiveDeliveryCharge() — returns 0 when free flag set or store_pickup, otherwise delivery_charge;
  scopeByDeliveryStatus() + scopeByDeliveryType() scopes added

- `StoreSaleRequest.php`: delivery_type/charge/charge_free/address/contact_phone/status validation added;
  delivery_address required_if inside_dhaka/outside_dhaka/parallel; payment_type validation added
  (was missing from Item 4.1); items.\*.variant_id nullable added (Item 3.3 missing fix)

- `SaleController.php`: store() — delivery_charge computed (free flag + store_pickup both force 0),
  grand_total now includes delivery_charge, delivery_status defaults to 'pending' for non-store_pickup,
  null for store_pickup; variant_id persisted in SaleItem (Item 3.3 missing fix);
  activity log includes delivery fields; salesList() — delivery_type + delivery_status filters added

- `Index.tsx` (Sales/Index): DeliveryType + DeliveryStatus types exported; Sale interface updated
  with 6 delivery fields; Filters interface updated; DELIVERY_TYPE_OPTIONS +
  DELIVERY_STATUS_OPTIONS exported; hasFilters includes delivery filters;
  Row 3 added to filter panel — Delivery Type + Delivery Status button groups

- `SaleTable.tsx`: DELIVERY_TYPE_OPTIONS + DELIVERY_STATUS_OPTIONS imported from Index;
  DeliveryTypeBadge + DeliveryStatusBadge components added; two new columns in table header + rows;
  overflow-x-auto added to wrapper for wide-table horizontal scroll

### Business Rules Established

- delivery_charge included in grand_total — not a separate transaction
- delivery_charge_free flag overrides delivery_charge to 0 at store() time
- store_pickup → delivery_charge forced 0, delivery_status stays null
- non-store_pickup → delivery_status defaults to 'pending' if not explicitly passed
- delivery_address mandatory for inside_dhaka / outside_dhaka / parallel (validated server-side)
- effectiveDeliveryCharge() is the authoritative method — never read delivery_charge directly

### Also Fixed (from prior items)

- payment_type validation missing from StoreSaleRequest (Item 4.1 oversight) — now added
- variant_id not persisted in SaleItem on store() (Item 3.3 oversight) — now added

---

## [v2.24 — Item 4.1] — Order Status Workflow — 2026-08-01

### Added

- Migration: `order_status` enum (processing/confirmed/out_for_delivery/delivered/cancelled/returned, default: processing) + `payment_type` enum (full_paid/half_paid/cash_on_delivery, nullable) added to `sales` table
- `Sale.php`: `order_status` + `payment_type` added to `$fillable`; `isDelivered()`, `isCancelled()`, `isReturned()` helper methods; `scopeByOrderStatus()` scope added
- `SaleController.php`: `store()` sets `order_status: 'processing'` by default; `salesList()` filters by `order_status` + `payment_type`
- `SalesIndex.tsx`: `Sale` interface + `ORDER_STATUS_OPTIONS` + `PAYMENT_TYPE_OPTIONS` exported; second filter row with button-group segmented filters for order status and payment type
- `SaleTable.tsx`: `OrderStatusBadge` + `PaymentTypeBadge` components; two new columns in table
- `SaleGrid.tsx`: `OrderStatusBadge` + `PaymentTypeBadge` badges in card status row

### Rules Established

- `order_status` always starts as `processing` on every new sale — never set by request input
- `payment_type` is nullable — POS sales created before 4.4 will have null value
- `ORDER_STATUS_OPTIONS` + `PAYMENT_TYPE_OPTIONS` defined once in `Index.tsx`, imported by child components — never duplicated
- Show.tsx order status display deferred to Item 4.8 (Sale Status History) — timeline UI করা হবে সেখানে

---

## [5.2] — Individual Bank under Bank Transfer

**Date:** 2026-07-31

### Added

- `payment_method_banks` table — individual banks under a Bank Transfer payment method
- `PaymentMethodBank` model with `calculateCharge()` helper
- `PaymentMethodBankController` — store / update / destroy (permission: `payment_method.edit`)
- `banks()` HasMany relation on `PaymentMethod` model
- `isBankTransfer()` helper on `PaymentMethod` model
- `bank_transfer` added to `payment_methods.type` enum (migration)
- Nested routes: `backend.payment-methods.banks.store/update/destroy`
- Banks sub-panel in `PaymentMethods.tsx` — expandable per Bank Transfer row (ChevronRight toggle)
- Bank modal (z-60) — bank name, account number, account name, charge config, active toggle
- Bank Transfer type in method modal shows info note instead of charge config
- Charge column in table shows bank count badge for Bank Transfer methods

### Logic

- bKash / Nagad / Rocket → `mobile_banking` type, method-level charge applies directly
- Bank Transfer → individual bank selected at checkout, that bank's charge applies
- Method-level charge config hidden for `bank_transfer` type

---

## [v2.23] — 2026-07-31

### Added

- Item 5.1: Payment Method Charge Config
    - Migration: added `online_charge_type`, `online_charge_value`, `charge_enabled`,
      `charge_label` columns to `payment_methods` table
    - PaymentMethod model: new columns in `$fillable` + `$casts`,
      `calculateCharge(float $subtotal)` helper method
    - PaymentMethodController: inline validation with charge guard,
      `can` array in Inertia props, ActivityLog fix (object instead of id)
    - PaymentMethods.tsx: charge config section in modal (type toggle, value,
      label, live preview), Charge column in table, `can`-gated action buttons

---

## [3.5] — 2026-07-30

### Added

- `stock_reservations` table — tracks storefront stock holds before payment verification
- `StockReservation` model with scopes: `active()`, `expired()` and status helpers
- `StockReservationService` — reserve(), convertToSale(), release(), sweepExpired()
- `SweepExpiredReservations` artisan command (`reservations:sweep-expired`) with `--dry-run` support
- Schedule entry in `routes/console.php` — sweeps expired reservations every 5 minutes
- `stock_reservation_minutes` business setting (default: 30) — group: inventory

### Fixed

- `SaleStockService::applyStock()` — wrapped in `DB::transaction()` + `lockForUpdate()` to prevent race conditions on concurrent POS sales
- `SaleStockService::reverseStock()` — same fix
- `SaleStockService::reApplyStock()` — same fix

---

## [3.3] — Product Variants

### Added

- `product_variants` table: id, product_id (FK cascade), sku (unique), attributes (JSON), stock_qty, price_override, cost_price_override, image_id, is_active, timestamps
- `variant_id` column added to `sale_items` and `stock_movements` (nullable FK → product_variants nullOnDelete)
- `ProductVariant` model: attributes cast to array, label/effective_price/effective_cost accessors
- `Product::variants()` and `Product::activeVariants()` HasMany relations
- `SaleStockService` — variant-aware stock deduction in applyStock(), reverseStock(), reApplyStock()
- `ProductController` — variants eager loaded in index/edit; store/update handles variant upsert (diff by id, delete removed)
- `StoreProductRequest` / `UpdateProductRequest` — variants (nullable string/JSON) validation rule added
- `VariantsPanel.tsx` — add/remove/edit variant rows with attributes key-value, price/cost override, active toggle
- `VariantPickerModal.tsx` — POS modal for selecting variant before adding to cart
- `ProductGrid.tsx` — has_variants + variants fields added to Product interface; variant products show "X variants" badge
- `POS/Index.tsx` — variant-aware cart: addToCartDirect(), VariantPickerModal integration, variant_id in checkout payload
- `CartItem.tsx` — variant_id, variant_label optional fields added to CartItemRow interface
- `ProductFormFields.tsx` — Product Variants section with has_variants toggle added between Shipping and POS & Display

### Known Issue (deferred)

- Min Sale Qty not enforced in POS cart — will fix in Sprint 2 (Item 4.4)

---

## [v2.23] — 2026-07-29

### Added — Item 1.5: Super Admin Cascade Delete — Soft Only

**New Files:**

- `app/Services/CascadeDeleteService.php` — dependency preview + soft-delete orchestration for all entity types
- `app/Console/Commands/ResetDatabaseCommand.php` — `php artisan db:reset-dev` (local env only, double confirmation)
- `app/Http/Controllers/Backend/DeletePreviewController.php` — GET /backend/delete-preview/{type}/{id} JSON endpoint
- `resources/js/Components/shared/ConfirmDeleteModal.tsx` — modal showing dependency preview before any delete
- `resources/js/hooks/useCascadeDelete.ts` — hook wiring modal + Inertia delete in one reusable unit

**Modified:**

- `routes/web.php` — added delete-preview route inside backend auth group

**Policy enforced:**

- Financial entities (Investment, Partner, Sale, Purchase, ProfitDistribution): soft delete only, hard delete permanently disabled
- Non-financial (ProductCategory, Unit, ExpenseCategory): force delete allowed only when zero dependants — frontend confirm button hidden when `can_delete: false`
- Dev reset: `php artisan db:reset-dev` only — no UI button exists

**Integration note:**

- `ConfirmDeleteModal` + `useCascadeDelete` hook to be wired into Index pages as each module is touched in Sprint 2–4
- Existing `destroy()` controllers need zero changes — soft delete already works via SoftDeletes trait
- `DeletePreviewController::resolveModel()` uses exact Spatie permission names from existing seeder

---

## [v2.23 — Item 1.1] — Settings: Fully Dynamic — 2026-07-29

### New Files (2)

- `app/Services/SettingsService.php`: cache-backed settings service —
  get($key, $default), all(), invalidate(); CACHE_KEY = 'business_settings_map';
  TTL = 24h; invalidated by Observer on every save/delete
- `app/Observers/BusinessSettingObserver.php`: saved() + deleted() hooks,
  both call SettingsService::invalidate()
- `resources/js/hooks/useSettings.ts`: frontend hook — currency, businessName,
  taxRate, taxEnabled, taxName, currencyPosition, decimalPlaces, raw map

### Updated Files (5)

- `app/Providers/AppServiceProvider.php`: BusinessSetting::observe(BusinessSettingObserver::class) added in boot()
- `app/Http/Middleware/HandleInertiaRequests.php`: 'settings' => SettingsService::all()
  added to share() — globally available on every Inertia response
- `app/Http/Controllers/Backend/InvoiceController.php`: resolveBusinessProfile()
  now uses SettingsService::all() instead of two separate BusinessSetting::getGroup() calls
- `resources/js/Layouts/AuthenticatedLayout.tsx`: sidebar business name reads
  settings?.business_name ?? 'Master POS' via usePage().props
- `resources/js/Pages/Backend/POS/Index.tsx`: ReceiptModal businessName prop reads
  settings?.business_name ?? 'Master POS' via usePage() inside component
- `resources/js/Pages/Backend/POS/_components/CartSidebar.tsx`: subtotal currency
  symbol reads settings?.currency_symbol ?? '৳' via usePage() inside component

### Rules Established

- usePage() is a React Hook — must always be called inside a function component body, never at module level
- SettingsService::all() is the single source for settings reads everywhere — never call BusinessSetting::getGroup() or BusinessSetting::get() in new code
- settings map globally available on frontend via usePage().props.settings
- Remaining 65+ files with hardcoded ৳ — update incrementally when working on those modules in later sprints

---

## [v2.22 — Gap 2.3] — Mixed Partner per-type Settlement/Eligibility — 2026-07-23

### New Migrations (2)

- `add_applies_to_to_partner_settlement_configs_table`:
  applies_to enum(capital/working/product/all) default 'all', after notes column
- `add_applies_to_to_partner_profit_eligibilities_table`:
  applies_to enum(capital/working/product/all) default 'all', after profit_end_date column

### Updated Files (10)

- `PartnerSettlementConfig.php`: applies_to added to $fillable; scopeForType(string $type)
  added — matches applies_to = type OR applies_to = 'all'; getAppliesToLabelAttribute()
  accessor added

- `PartnerProfitEligibility.php`: applies_to added to $fillable; scopeForType(string $type)
  added — same pattern as PartnerSettlementConfig; getAppliesToLabelAttribute() accessor added

- `PartnerSettlementConfigController.php`: store() uniqueness check updated —
  one active config per partner per applies_to value (was: one per partner total);
  applies_to added to validation in store() and update(); activity log includes applies_to

- `PartnerEligibilityController.php`: applies_to added to store() validation

- `PartnerEligibilityService.php`: isEligible(), isEligibleBatch(), hasActiveEligibility()
  all receive optional $type = 'all' parameter — forType() scope applied to all queries;
  create() persists applies_to from $data; resume() carries forward applies_to from
  paused record to new active record

- `SettlementCalculationService.php`: getActiveConfig() updated — Option A resolution:
  specific stream config (applies_to = type) wins over 'all' fallback; $type parameter
  added to calculate(), getActiveConfig(), hasActiveConfig(), getSettlementType(),
  getPaymentPreference()

- `partner.d.ts`: AppliesToType type alias added; applies_to + applies_to_label added
  to PartnerSettlementConfig and PartnerEligibility interfaces; applies_to added to
  SettlementConfigFormData and EligibilityFormData

- `CreateSettlementConfigModal.tsx` / `EditSettlementConfigModal.tsx`: applies_to
  selector added — filtered by partner type flags via useMemo; hidden when partner
  has only one type (no choice needed); description hint shown per selection

- `SettlementConfigPanel.tsx`: activeConfig (single) → activeConfigs (array);
  Add Config button always visible; applies_to badge (Layers icon) added to every
  ConfigCard; active count badge in header

- `EligibilityPanel.tsx`: activeRecord (single) → activeRecords (array);
  pausedRecord (single) → pausedRecords (array); PausedBanner extracted as separate
  component with applies_to badge; applies_to badge added to ActiveRecordCard and
  HistoryRow; Add Eligibility button always visible

### Bug Fixes

- `PauseEligibilityModal.tsx`: route name fixed —
  `partners.eligibilities.pause` → `backend.partners.eligibilities.pause`
- `ResumeEligibilityModal.tsx`: route name fixed —
  `partners.eligibilities.resume` → `backend.partners.eligibilities.resume`

### Business Rules Established

- Mixed Partner can have multiple active settlement configs simultaneously —
  one per stream (capital / working / product / all)
- Mixed Partner can have multiple active eligibility records simultaneously —
  one per stream; pausing one stream does not affect others
- Option A resolution in SettlementCalculationService: specific stream config
  always wins over 'all' fallback — never merge or average
- applies_to carried forward on resume — new active record inherits stream
  from the paused record it resumes
- applies_to selector hidden for single-type partners — 'all' used automatically
- Existing records default to 'all' via migration — fully backward compatible

---

## [v2.21 — Gap 1.4] — Partner Financial Overview Page — 2026-07-23

### New Files (0)

No new files — all data pulled from existing tables and services.

### Updated Files (3)

- `partner.d.ts`: `PartnerCapitalSummary` interface added — one record per
  linked investment, holds total_deposited, total_withdrawn, current_balance,
  unlocked_amount, locked_amount, available_to_withdraw, unlock_percent;
  `PartnerShowProps` updated with `capitalSummaries: PartnerCapitalSummary[]` prop

- `PartnerController.php` (show method): capital summaries block added after
  recentProfitItems query — iterates partner's linked investments, calls
  `computeAndSaveUnlockStatus()` on each `InvestorCapitalBalance` for live
  lock recompute (Gap 4.1 pattern), builds summary array with unlock_percent
  computed as `min(100, (unlocked / deposited) * 100)`; null balances filtered
  via `->filter()->values()`; `capitalSummaries` prop added to Inertia render

- `Partners/Show.tsx`: `PartnerCapitalSummary` imported from partner.d.ts;
  `Lock`, `Unlock`, `Wallet` icons added from lucide-react; `ExtendedShowProps`
  extended with `capitalSummaries`; `CapitalOverviewSection` component added —
  renders nothing when summaries empty (pure working/product partners),
  one card per linked investment with: investment title link → capital-ledger.show,
  Primary badge, investment date, 3-col balance stat boxes (Deposited/Withdrawn/
  Current Balance), principal lock progress bar (green fill = unlock%), 3 lock
  stat boxes (Unlocked green / Locked amber / Available indigo); `capitalSummaries`
  destructured in main component and passed to `CapitalOverviewSection`;
  section placed in main column between Partner Information card and Profit Balance
  card; `RecentProfitPaymentsCard` partnerId prop removed (unused); Quick Actions
  sidebar card now conditionally rendered only when `capitalSummaries.length > 0`

### Business Rules Established

- Capital Overview section hidden entirely for pure working/product partners
  (no linked investments → `capitalSummaries` is empty array → component returns null)
- Lock status recomputed live on every Partner Show page load via
  `computeAndSaveUnlockStatus()` — same pattern as Investment Show and
  Capital Ledger Show pages; no stale data possible
- One card per linked investment — aggregate totals not used, preserving
  per-investment lock tracking (each investment has its own investment_date floor)
- `available_to_withdraw` floored at 0 via `max(0, unlocked − withdrawn)` —
  prevents negative display when edge cases occur
- Capital Ledger link in CapitalOverviewSection header navigates to ledger index,
  not per-investment show, because Partner Show already shows the summary inline

---

## [v2.20 — Gap 1.3] — Distribution List Source Type Badge & Filter — 2026-07-23

### New Files (0)

No new files.

### Updated Files (4)

- `profit-distribution.d.ts`: `DistributionSourceType` type alias added
  (`"investment_based" | "partner_based"`); `Distribution.source_type` field
  added as required `DistributionSourceType` (DB default ensures all records
  have a value)

- `ProfitDistributionController.php` (index method):
  `source_type` filter query added — `where('source_type', $sourceType)` when
  param present; `source_type` added to `filters` array in Inertia render

- `ProfitDistributions/Index.tsx`:
  `DistributionSourceType` imported from types; `SOURCE_TYPE_OPTIONS` const
  array defined at module level (All Types / Legacy / Partner-based);
  `sourceType` state added, initialized from `filters.source_type`;
  `applyFilters()` passes `source_type: sourceType`; `resetFilters()` clears
  `sourceType`; `hasActiveFilter` replaces inline `(search || status || year)`
  check — now includes `sourceType`; button group UI added below existing
  filter row — segmented control with per-type active color

- `ProfitDistributions/_components/ProfitDistributionTable.tsx`:
  `SourceTypeBadge` component added — `partner_based` → indigo-100/700 badge
  labeled "Partner-based"; `investment_based` → gray-100/500 badge labeled
  "Legacy"; "Type" `<th>` added after "Title"; `<SourceTypeBadge>` `<td>`
  added in matching row position

### Business Rules Established

- `investment_based` distributions display as "Legacy" (gray badge) —
  communicates that these are pre-Partner-domain records
- `partner_based` distributions display as "Partner-based" (indigo badge) —
  consistent with indigo used throughout the Partner domain
- Source type filter is independent of status and year filters —
  all four filters combine with AND logic via query string
- No data change — `source_type` column and values exist since Phase 4H

---

## [v2.19 — Gap 2.4] — Mixed Rule Resolution Clarification — 2026-07-22

### Documentation Only — No Code Changes

### Updated Files (1)

- `BUSINESS_RULES.md` (Section 3 — Rule Resolution at Calculation Time):
    - "most recent matching rule" statement replaced with explicit two-case
      resolution rule
    - Case 1 (same rule_type): most recent matching rule by effective_from —
      applies when a partner has multiple versions of the same rule_type
      due to versioning (old rule gets effective_to set, new rule created)
    - Case 2 (different rule_type): all applicable rules resolved independently
      and summed — MixedStrategy case; a partner with fixed_percent + product_based
      rules gets both calculated and added together
    - Example added: fixed_percent 25% + product_based 65% on same partner →
      Rule A result (10,000 BDT) + Rule B result (5,200 BDT) = 15,200 BDT total
    - Constraint documented: a partner cannot have two active rules of the
      same rule_type simultaneously

### Business Rules Established

- Same rule_type + multiple versions → most recent matching rule (by effective_from)
- Different rule_type + same partner → all applicable rules summed (MixedStrategy)
- MixedStrategy does NOT pick a single "most recent" rule across different rule_types —
  it sums results from ALL applicable rules independently
- A partner cannot have two active rules of the same rule_type active simultaneously
- These rules apply at calculation time in ProfitCalculationEngine —
  no engine code change needed; behavior was already correct,
  only the documentation was ambiguous

---

## [v2.18 — Gap 1.2] — Investor Statement Partner Support — 2026-07-22

### New Files (2)

- `InvestorStatements/PartnerShow.tsx`: Partner-only statement page.
  Header with partner name, code, type badge. Partner Information card.
  Profit Summary card (total pending, earned, paid). Cost Return Summary
  card (product partners only, shown when total_cost_returned > 0).
  Distribution History table: Profit Share / Cost Return / Total columns,
  payment status badge, tfoot totals. Export PDF button.
- `pdf/partner-statement.blade.php`: Partner PDF (A4 portrait, DejaVu Sans).
  Header with logo + type/status badges. Section 1: Partner Information.
  Section 2: Profit Summary card + Cost Return Summary card (conditional).
  Section 3: Distribution History table with profit share / cost return /
  total columns. Fixed footer with page number. No capital section.

### Updated Files (7)

- `InvestorStatementController.php`:
    - `index()`: merges investment rows + partner rows; partner rows include
      only partners with no linked investment AND ≥1 distribution item;
      both row types carry `type: 'investment'|'partner'` field
    - `show()`: distribution items now queried directly via
      `ProfitDistributionItem` with `investment_id OR (partner_id + null investment_id)`
      — catches partner_based items when investment.partner_id is set;
      `cost_return_amount` added to distribution_history map
    - `pdf()`: same OR query as show()
    - `showPartner(Partner $partner)`: new — loads PartnerProfitBalance +
      distribution items by partner_id; renders PartnerShow.tsx
    - `pdfPartner(Partner $partner)`: new — same data, renders
      partner-statement.blade.php
    - `partnerTypeLabel()`: new private helper

- `routes/web.php`: investor-statements section replaced — old single route
  split into 5 routes: index, investment show, investment pdf,
  partner show, partner pdf

- `investor-statement.d.ts`: `type` field added to `InvestorStatementSummary`;
  `investment_date` made nullable; 4 new partner interfaces added:
  `PartnerStatementInfo`, `PartnerProfitBalanceSummary`,
  `PartnerStatementDistributionItem`, `PartnerStatement`

- `InvestorStatements/Index.tsx`: `statementUrl()` helper routes to correct
  show page by `type`; `PartnerTypeBadge` component for partner rows;
  capital columns show "—" for partner rows; tfoot totals filter by type;
  React key uses `type-id` composite to prevent collision

- `InvestorStatements/Show.tsx`: capital summary section conditional
  (hidden when `total_deposited = 0`); capital transactions section
  conditional (hidden when array empty)

- `pdf/investor-statement.blade.php`: capital summary card wrapped in
  `@if total_deposited > 0`; capital transactions section wrapped in
  `@if isNotEmpty()`

- `Partner.php`: `distributionItems()` HasMany relation added
  (FK: `partner_id` on `profit_distribution_items`)

### Business Rules Established

- Investment statements include both investment_based AND partner_based
  distribution items when `investments.partner_id` is set — single complete
  view per investor regardless of distribution source type
- Partner statements (no investment) show profit-only view — no capital
  section, no capital transactions
- Index page lists all investors + standalone partners (no investment, ≥1
  distribution) in one unified table
- Partners with linked investments appear as investment rows — their
  partner_based items are merged into the investment statement
- `investments.partner_id` must be set for OR query to work — without it,
  partner_based items are invisible in investment statements

---

## [v2.17 — Gap 1.5] — Investment/Partner Show Page Financial Summary — 2026-07-21

### New Files (0)

No new files — all data pulled from existing tables and services.

### Updated Files (4)

- `InvestmentController.php` (show method):
    - Loads InvestorCapitalBalance + computeAndSaveUnlockStatus() on every page load
    - Loads InvestorProfitBalance (investment-based profit history)
    - Loads CapitalLedgerEntry last 5 (completed/approved only)
    - Loads ProfitDistributionItem last 5 (non-pending, non-cancelled)
    - Loads partner.profitBalance if investment.partner_id exists
    - All 5 new props passed to Inertia render

- `Investments/Show.tsx` (full update):
    - Investment date picker migrated from Mantine DatePickerInput → AppDateInput
    - Capital Summary card: total_deposited/withdrawn/reinvested/current_balance
    - Principal Lock Status: progress bar + Unlocked/Locked/Available stat boxes
    - Profit Summary card: total_earned/paid/deferred/reinvested/pending_balance
    - Partner Profit Balance card (shown only when investment.partner_id exists):
      cost return section + profit share section, each with accrued/paid/pending
    - Recent Capital Transactions table (last 5) with "View Ledger" link
    - Recent Profit Payments table (last 5) with distribution links
    - Linked Partner row in Investment Information (links to Partner Show page)
    - Quick Actions sidebar: Capital Ledger + Full Statement buttons added

- `PartnerController.php` (show method):
    - ProfitDistributionItem import added
    - recentProfitItems query added (last 5, partner_id keyed,
      non-pending/non-cancelled, with profitDistribution eager load)
    - recentProfitItems prop passed to Inertia render

- `Partners/Show.tsx` (updated):
    - RecentProfitItem interface added
    - ExtendedShowProps extends PartnerShowProps with recentProfitItems
    - StatBox helper component added
    - ProfitBalanceCard component: cost return + profit share sections,
      pending total badge in header
    - RecentProfitPaymentsCard component: profit share + cost return columns,
      distribution links, payment status badges
    - Both new cards placed in main col (lg:col-span-2), above LinkedInvestmentsCard

### Business Rules Established

- Investment Show page is the single complete financial picture for an investor —
  admin never needs to leave this page to answer capital or profit questions
- Partner Show page profit balance shows cost return and profit share separately —
  consistent with Gap 4.2 tracking model
- Capital lock status recomputed from live sales on every Investment Show page load
  (same pattern as Capital Ledger Show page — no stale data)
- Recent entries capped at 5 — "View All" links point to Capital Ledger /
  Investor Statement pages for full history

---

## [v2.16 — Gap 4.2] — Product Partner Cost/Profit Split — 2026-07-20

### New Migrations (2)

- `create_partner_profit_balances_table`:
  partner_id (FK unique), total_cost_returned, total_cost_paid,
  pending_cost_balance, total_profit_earned, total_profit_paid,
  pending_profit_balance — all decimal(10,2) default 0
- `add_cost_return_amount_to_profit_distribution_items_table`:
  cost_return_amount decimal(10,2) nullable default 0, after share_amount column

### New Files (2)

- `PartnerProfitBalance.php`: findOrCreateForPartner(), creditCostReturn(),
  creditProfitShare(), recordPayment(), reversePayment(), reverseEarned(),
  totalPending() — all balance operations
- `PartnerProfitBalanceService.php`: creditEarned(), recordPayment(),
  reversePayment(), reverseEarned(), splitAmount() (private — proportional
  cost/profit split based on cost_return_amount ratio)

### Updated Files (7)

- `ProductBasedStrategy.php`: share_amount = cost_return + profit_share (total),
  profit_share_amount added as separate key in return array
- `Partner.php`: profitBalance() HasOne relation added
- `partner.d.ts`: PartnerProfitBalance interface added; PartnerShowProps
  updated with profitBalance prop
- `profit-calculation.d.ts`: profit_share_amount added to PartnerPreviewItem
- `ProfitDistributionController.php`: constructor inject PartnerProfitBalanceService;
  store/update persist cost_return_amount; approve() calls creditEarned()
  for partner_based distributions inside DB::transaction()
- `ProfitDistributionItem.php`: cost_return_amount added to fillable/casts;
  partner() BelongsTo added; markAsPaid/Deferred/Reinvested call
  PartnerProfitBalanceService::recordPayment(); cancelPayment() calls
  reversePayment() for partner-based items
- `PartnerBasedPreviewTable.tsx`: "Share Amount" column split into
  "Profit Share" (indigo) + "Cost Return" (green) + "Total Payable" (bold gray);
  tfoot totals updated for all three columns
- `PartnerController.php`: profitBalance eager loaded in show(); profitBalance
  prop passed to Inertia render
- `Edit.tsx` (ProfitDistributions): date inputs migrated from
  <input type="date"> to AppDateInput (distribution_date) and
  AppDateRangeInput (period range); dayjs import added

### Also Resolves

- Gap 1.1 (Partner Profit Balance for working/product partners) — resolved
  as part of this implementation. No separate build needed.

### Business Rules Established

- share_amount = total payable (cost_return_amount + profit_share_amount)
- cost_return_amount stored separately for split balance tracking
- profit_share_amount derived: share_amount − cost_return_amount (never stored)
- splitAmount() uses proportional ratio — partial payments split correctly
- PartnerProfitBalanceService is the single authority — never call balance
  methods directly from controllers

---

## [v2.15 — Gap 4.1] — Capital Principal Lock + Partial Unlock — 2026-07-19

### New Migration (1)

- `add_lock_columns_to_investor_capital_balances_table`:
  unlocked_amount decimal(10,2) default 0,
  locked_amount decimal(10,2) default 0
  Both added after current_balance column.

### Updated Files (5)

- `InvestorCapitalBalance.php`:
    - unlocked_amount + locked_amount added to $fillable and $casts
    - computeAndSaveUnlockStatus(string $investmentDate): queries Sale::sum('grand_total')
      where sale_date >= investment_date, computes MIN(total_deposited, total_sales),
      saves unlocked_amount + locked_amount via forceFill()->save()
    - availableToWithdraw(): returns max(0, unlocked_amount − total_withdrawn)
    - canWithdraw(float $amount): now checks BOTH current_balance AND availableToWithdraw()
      (previously only checked current_balance)

- `CapitalWithdrawalController.php`:
    - approve(): recomputes unlock status before approval check; error message includes
      available amount, locked amount, and % of principal recovered through sales
    - store() withdrawal section: guard moved to pre-flight BEFORE DB::transaction()
      (Rule 18 pattern — redirect()->withErrors() cannot be called inside transaction)

- `CapitalLedgerController.php`:
    - show(): calls computeAndSaveUnlockStatus() after balance load — fresh on every page load
    - balance array now includes: unlocked_amount, locked_amount, available_to_withdraw

- `CapitalLedger/Show.tsx`:
    - Lock icon + Unlock icon imported from lucide-react
    - Principal Lock Status card added (between pending withdrawals alert and balance summary)
    - Progress bar: green fill = unlocked %, gray = locked %
    - 3 stat boxes: Unlocked (green), Locked (amber), Available to Withdraw (indigo)
    - Fully locked notice shown when availableToWith <= 0
    - investment_date sliced to [0,10] — fixes raw timestamp display bug
    - WithdrawalModal now receives availableToWithdraw prop

- `WithdrawalModal.tsx`:
    - availableToWithdraw prop added (number)
    - exceedsUnlocked check added alongside exceedsBalance
    - fullyLocked computed — disables input and submit button when true
    - 2-column hint row: Current Balance + Available to Withdraw
    - Fully locked warning banner shown when availableToWithdraw <= 0
    - Submit button disabled when hasError OR fullyLocked

### Bug Fixes

- Raw timestamp in header: investment_date.slice(0,10) applied in Show.tsx
- Withdrawal guard inside DB::transaction() causing redirect() failure:
  moved to pre-flight block before transaction in CapitalLedgerController::store()

### Business Rules Established

- Principal lock formula: unlocked_amount = MIN(total_deposited, total_sales_since_investment_date)
- locked_amount = total_deposited − unlocked_amount
- available_to_withdraw = unlocked_amount − total_withdrawn (cannot go below zero)
- Unlock status recomputed from live sales on every Capital Ledger Show page load
- Unlock status also recomputed at withdrawal request time (store pre-flight) and
  approval time (approve double guard) — no stale data possible
- Withdrawal blocked at both frontend (modal) and backend (controller) when amount
  exceeds available_to_withdraw
- Error message format: "You can currently withdraw up to ৳X BDT — ৳Y BDT is still
  locked (Z% of principal has been recovered through sales)."

---

## [v2.14 — Gap 2.1 + 2.5] — Partner Type ↔ Rule Validation + Deactivated Guard Verified — 2026-07-19

### Updated Files (4)

- `PartnerRuleResolutionService.php`: validateProfitSourceForPartner() method added —
  returns error message if profit_source is incompatible with partner's type flags;
  null if valid. Mapping: capital_share→partner_type_capital, working_share→partner_type_working,
  product_share→partner_type_product, custom→always allowed.
- `PartnerProfitRuleController.php`: constructor injection of PartnerRuleResolutionService added;
  store() and update() both call validateProfitSourceForPartner() after $request->validate() —
  returns back()->withErrors(['profit_source' => $error])->withInput() if invalid.
- `CreateProfitRuleModal.tsx`: AvailableSource interface, InputEvent/FormErrors/FormPayload
  type aliases added; availableSources useMemo computes enabled/disabled per partner type flags;
  activeTypeLabels useMemo shows hint text; profit_source select renders disabled options
  with "(not applicable)" label for incompatible sources.
- `EditProfitRuleModal.tsx`: same filtering logic as CreateProfitRuleModal — AvailableSource
  interface, FormErrors type alias, availableSources + activeTypeLabels useMemo,
  disabled profit_source options with hint text.

### Gap 2.5 — Verified (No Build Required)

- ProfitCalculationEngine::previewPartnerBased() already has:
  Partner::where('is_active', true)->whereNull('deleted_at')->get()
  Both deactivated and soft-deleted partners are excluded from all distributions.
  No code change needed.

### TypeScript Fixes Applied (from Gap 2.1 session)

- Inline generic types (Partial<Record<keyof X, string>>) extracted to named type aliases
  to avoid JSX parser confusion in .tsx files
- useMemo return types explicitly annotated: useMemo<AvailableSource[]>, useMemo<string[]>
- handleChange typed via named InputEvent / FormFieldChangeEvent alias
- router.post/put payload cast via form as unknown as FormPayload
- onError callback typed directly: (errs: FormErrors) => void

### Business Rules Established

- profit_source must match partner type: capital_share requires partner_type_capital=true,
  working_share requires partner_type_working=true, product_share requires partner_type_product=true
- custom profit_source is always allowed regardless of partner type
- Validation applied on both create and edit (pending rules only) flows
- Frontend disables incompatible options as UX hint — backend enforces as hard validation
- Deactivated partners (is_active=false) and soft-deleted partners are already excluded
  from profit distributions at engine level — confirmed in previewPartnerBased()

---

## [v2.13 — Gap 2.2] — Settlement Config Approval Columns — 2026-07-19

### New Files (1)

- `Step17Gap22PermissionSeeder.php`: settlement_config.approve permission → Admin role

### New Migration (1)

- `add_approval_columns_to_partner_settlement_configs_table`:
  approved_by (FK users nullable nullOnDelete), approved_at (timestamp nullable)
  Existing records auto-approved via migration (Super Admin id=1)

### Updated Files (5)

- `PartnerSettlementConfig.php`: approve() method, is_pending/is_approved accessors,
  approvedBy() relation, approved_by/approved_at excluded from $fillable (Rule 66)
- `PartnerSettlementConfigPolicy.php`: approve() method added (separate from edit)
- `PartnerSettlementConfigController.php`: approve() action added; update()/destroy()
  block approved configs; store() success message updated to note pending approval
- `routes/web.php`: settlement-configs.approve route added BEFORE update/destroy
- `partner.d.ts`: approved_by, approved_at, is_pending, is_approved added to
  PartnerSettlementConfig interface; SettlementConfigCan.approve added
- `SettlementConfigPanel.tsx`: Pending Approval badge (yellow), Approved badge (green),
  approve button (CheckCircle icon), edit/delete hidden for approved configs
- `PartnerPeriodResolutionService.php`: deferred removed from payment_status lock list —
  deferred = unpaid, period stays open; only paid/reinvested lock a period

### Business Rules Established

- Settlement config changes require Super Admin approval before taking effect
- Approved configs are immutable — edit/delete blocked at controller level
- Deferred distribution items do NOT lock a partner's period in subsequent distributions
- Only paid/reinvested statuses count as "period covered" in overlap check

---

## [v2.12 — Gap 4.4 + 4.5] — Duplicate Prevention + Per-Partner Effective Period Resolution — 2026-07-18

### New Files (2)

- `PartnerPeriodResolutionService.php`: Core service — resolves effective period per partner.
    - `resolveAll()`: computes Effective Period per partner using eligibility window + last-paid-up-to date
    - `groupByEffectivePeriod()`: groups partners sharing same Effective Period for Financial Summary reuse
    - `getEligibilityWindows()`: queries partner_profit_eligibilities for active + overlapping records
    - `getLastPaidUpTo()`: queries prior settled distributions for each partner's latest paid period_end
    - `buildAdjustmentReason()`: human-readable note explaining why effective period differs from selected
- `EffectivePeriodGroup.php` (DTO): holds one unique Effective Period + its partner IDs + Financial Summary
    - `attachSummary()`: called by engine after computing Financial Summary for this period group
    - `distributableAmount()`: applies distribution_percent to net_profit for this group
    - `fromArray()`: builds from PartnerPeriodResolutionService::groupByEffectivePeriod() output

### Updated Files (5)

- `ProfitCalculationEngine.php`:
    - `preview()` now accepts `$excludeDistributionId` (nullable) — passed to period resolution service
    - `previewPartnerBased()` replaces `calculatePartnerBased()` — computes Financial Summary ONCE per
      unique Effective Period group, not once per distribution
    - Rule resolution now uses per-partner `effective_start` date, NOT global `$periodStart` —
      fixes bug where partner with `effective_from = Jul 7` was missed when selected period started Jul 6
    - `ineligibleResult()` now accepts optional `$resolved` array — attaches effective_period info
      to ineligible items for frontend display
    - `emptyPartnerPreview()` helper added for when no active partners exist
- `ProfitCalculationController.php`:
    - `exclude_distribution_id` validation + parameter added — passed to engine for Edit page overlap exclusion
- `profit-calculation.d.ts`:
    - `AlreadyPaidInfo` interface added: `paid_up_to`, `paid_up_to_next_day`, `distribution_no`
    - `EffectivePeriodInfo` interface added: `start`, `end`, `selected_start`, `selected_end`,
      `adjustment_reason`, `last_paid_info`, `financial_summary`
    - `PartnerPreviewItem.effective_period` field added (optional `EffectivePeriodInfo | null`)
    - Index signature updated to include `EffectivePeriodInfo`
- `PartnerBasedPreviewTable.tsx`:
    - `EffectivePeriodCell` component added — shows computed date range, "Already Paid up to X" badge,
      adjustment reason note
    - "Effective Period" column added to eligible partners table
    - Ineligible section now shows computed effective period dates for admin transparency
    - `colSpan` values updated throughout (10 → 11)
- `Edit.tsx`:
    - `PartnerPreviewItem` import + `PartnerBasedPreviewTable` import added
    - `ItemData` interface extended: `cost_return_amount`, `rule_type`, `partner_name`, `partner_code`,
      `effective_period` fields added; index signature updated to include `undefined`
    - `handleRecalculate()`: `exclude_distribution_id: distribution.id` param added to axios call
    - `handleRecalculate()` toast: eligible count now correctly computed for partner_based
    - Section 3 Share Breakdown: partner_based now renders `PartnerBasedPreviewTable` (was plain table)

### Business Logic Implemented

- **Overlap check:** `new.period_start <= existing.period_end AND new.period_end >= existing.period_start`
- **Settled statuses:** `paid`, `reinvested`, `deferred`
- **Scope:** both `investment_based` AND `partner_based` distributions checked
- **Effective Period formula per partner:**

Effective Start = MAX(selected_start, eligibility_start, last_paid_up_to + 1 day)
Effective End = MIN(selected_end, eligibility_end)
If Effective Start > Effective End → partner fully ineligible

- **Financial Summary grouping:** partners sharing identical Effective Period reuse same computed summary
- **UI label:** "Already Paid up to {date} (from {distribution_no})"

### Errors Encountered & Lessons Learned

1. **`ProductBasedStrategy.php` contained wrong class** — `ProfitCalculationController` code was
   accidentally written into `ProductBasedStrategy.php`, causing FatalError:
   "Cannot declare class ProfitCalculationController, because the name is already in use".
   Fix: restore `ProductBasedStrategy.php` to original content, create `ProfitCalculationController.php`
   as a separate file.
   Rule to remember: when delivering multiple files in sequence, always verify namespace and class name
   match the file path before saving.

2. **Rule resolution using global `$periodStart` instead of per-partner `effective_start`** —
   A partner with `effective_from = Jul 7` was marked ineligible ("No approved profit rule active
   at period start") when selected period started Jul 6, because `resolveForPartners()` was called
   with the global selected start date.
   Fix: resolve rules per-partner using `effective_start` from resolved period, not global `$periodStart`.
   Rule to remember: rule resolution anchor date must always be the partner's own effective_start,
   never the distribution's selected period_start. These differ when eligibility or prior payments
   push the effective start forward.

3. **Ineligible partner items (share_amount = 0) store হচ্ছিল** —
   Effective period empty হওয়া partners (already paid) distribution items হিসেবে
   insert হচ্ছিল share_amount = 0 নিয়ে। এতে payment pending থাকত এবং
   "Mark Distributed" block হত।
   Fix: store() এবং update() উভয়তে filter যোগ করা হয়েছে —
   `is_eligible !== false AND share_amount > 0` শর্ত পূরণ না করলে item insert হবে না।
   Rule to remember: ineligible items শুধু preview-এ দেখানো হয় (admin awareness এর জন্য),
   কখনো database এ persist হয় না।

4. **`investment_type` NOT NULL constraint violation** —
   FixedPercentStrategy এবং Engine ineligibleResult() এ `investment_type` field
   return করা হচ্ছিল না।
   Fix: FixedPercentStrategy এ `'investment_type' => 'fixed_percent'` যোগ,
   ineligibleResult() এ `'investment_type' => 'partner_based'` যোগ,
   Controller store()/update() এ `?? 'partner_based'` fallback যোগ।
   Rule to remember: প্রতিটি strategy এর return array তে `investment_type` থাকতে হবে —
   partner-based items এর জন্য rule_type value ব্যবহার করো।

    ### New Files (3)

- `AppDateInput.tsx` (`resources/js/Components/DatePicker/AppDateInput.tsx`):
  Single date picker using Mantine Calendar. Friday highlighted red (BD weekend),
  today shown with dashed indigo outline, clearable, supports minDate/maxDate.
- `AppDateRangeInput.tsx` (`resources/js/Components/DatePicker/AppDateRangeInput.tsx`):
  Date range picker with two-click selection (start → end), hover range preview,
  and preset sidebar (This Week, Last Week, This/Last Month, Quarter, Year, Last N Days).
  BD calendar: Saturday first day, Friday weekend.
- `index.ts` (`resources/js/Components/DatePicker/index.ts`):
  Barrel export for both components and `DEFAULT_PERIOD_PRESETS`.

### Updated Files (1)

- `Create.tsx` (ProfitDistributions): `AppDateInput` for distribution_date,
  `AppDateRangeInput` for period range. `onChange` handler fixed to reset
  preview on both preset selection and manual calendar clicks.

### Known Issues / Deferred

- `Edit.tsx` (ProfitDistributions): Still uses `<input type="date">` — to be
  migrated to `AppDateInput`/`AppDateRangeInput` in a future session.
  Tracked here so it is not forgotten.

### Rules Established

- Never use `<input type="date">` anywhere — always use `AppDateInput` or `AppDateRangeInput`
- Never use Mantine DatePickerInput directly in pages — always via these wrapper components
- `AppDateRangeInput.onChange` fires only when BOTH dates set — also handle `onStartChange`
  for intermediate reset logic
- Future date types → new component in `resources/js/Components/DatePicker/`, export from index

5. **`RuntimeException` inside `DB::transaction()` causes 500 instead of user-friendly error** —
   `store()` এ `empty($eligibleItems)` check টা transaction এর ভেতরে ছিল।
   RuntimeException transaction এর ভেতর থেকে throw হলে Laravel 500 দেয়,
   user-friendly redirect হয় না।
   Fix: pre-flight check transaction এর বাইরে — `partner_based` হলে eligible items
   আগেই check করো, empty হলে `back()->withErrors()` দিয়ে return করো।
   `Create.tsx` এর `onError` handler এ `errs.items` আলাদাভাবে toast দেখায়।
   Rule to remember: validation/guard যা user-facing error দেওয়া উচিত সেটা
   কখনো `DB::transaction()` এর ভেতরে throw করো না — pre-flight check করো
   transaction শুরুর আগে।

---

## [v2.11 — Step 17 Phase 4H] — Existing Table Migrations — 2026-07-17

### New Migrations (5)

- `add_partner_id_to_investments_table`: partner_id (FK partners nullable nullOnDelete)
- `add_source_type_to_profit_distributions_table`: source_type enum(investment_based/partner_based) default investment_based
- `add_partner_id_to_investor_profit_balances_table`: partner_id (FK partners nullable nullOnDelete)
- `add_partner_id_to_capital_ledger_entries_table`: partner_id (FK partners nullable nullOnDelete)
- `add_partner_id_to_investor_capital_balances_table`: partner_id (FK partners nullable nullOnDelete)

### Updated Models (5)

- `Investment`: partner_id added to $fillable; partner() BelongsTo relation added
- `ProfitDistribution`: source_type added to $fillable
- `InvestorProfitBalance`: partner_id added to $fillable; partner() BelongsTo relation added
- `CapitalLedgerEntry`: partner_id added to $fillable; partner() BelongsTo relation added
- `InvestorCapitalBalance`: partner_id added to $fillable; partner() BelongsTo relation added

### Bug Fixes

- `ProfitDistribution::approve()`: partner-based items (investment_id=null) now skipped
  in InvestorProfitBalance credit loop — prevents TypeError on null investment
- `ProfitDistributionItem::markAsPaid/Deferred/Reinvested/cancelPayment()`:
  investment_id null guard added — partner-based items skip InvestorProfitBalance
  operations entirely; cancelPayment() still decrements deferred/reinvested amounts
- `ProfitPaymentController::store()`: investment_id null guard added before reinvest
  capital bridge — partner-based reinvest skips CapitalLedgerEntry creation
- `ProfitDistributionController::update()`: source_type now saved on update;
  partner-based fields (partner_id, profit_rule_snapshot, settlement_type) now
  included in items array on update
- `Edit.tsx`: key={item.investment_id} → key={i} — React key warning fixed for
  partner-based items where investment_id is null
- `Edit.tsx`: fmt() null-safe — invested_amount null no longer crashes
- `Edit.tsx`: recalculate endpoint updated to profit-calculation.preview with
  source_type param — partner-based recalculation now works correctly
- `Show.tsx`: source_type added to Distribution interface; Invested column
  conditional on investment_based; EligibilityPanel hidden for partner_based

### Known Issues Fixed from Phase 4F

- Edit.tsx React key warning — FIXED (key={i} instead of key={item.investment_id})
- ProfitPaymentController 500 error on partner-based distribution payment — FIXED
  (null investment_id guard in ProfitDistributionItem payment methods)

### Errors Encountered & Lessons Learned

1. **source_type not set on store()** — Distribution 23 was created as
   investment_based even though items were partner-based. Root cause: store()
   was not passing source_type to ProfitDistribution::create(). Fix: source_type
   already existed in store() — the specific test record needed a manual tinker fix:
   `$pd->forceFill(['source_type' => 'partner_based'])->save()`

2. **TypeError on null investment in payment flow** — InvestorProfitBalance
   ::findOrCreateForInvestment() typed-hinted Investment, not nullable.
   Called from ProfitDistributionItem with null investment for partner-based items.
   Fix: add `if ($this->investment_id && $this->investment)` guard before
   every InvestorProfitBalance call in markAsPaid/Deferred/Reinvested/cancelPayment.
   Rule to remember: any method touching InvestorProfitBalance must guard
   against null investment_id — partner-based items never have one.

3. **cancelPayment() deferred/reinvested amounts not reversed** — When investment
   guard was added naively, deferred_amount/reinvested_amount decrement was also
   skipped for partner-based items. Fix: add else branch to decrement amounts
   even when investment_id is null.

4. **Edit.tsx recalculate hitting wrong endpoint** — Old endpoint
   `calculate-preview` was investment_based only. Partner-based recalculation
   requires `profit-calculation.preview` with source_type param.
   Rule: Edit.tsx and Create.tsx must always use the same calculation endpoint.

5. **React key={item.investment_id} warning** — investment_id null for
   partner-based items causes duplicate/null React keys.
   Rule: never use a nullable field as React key — always use item.id
   (from DB) or array index as fallback.

---

## [v2.10 — Step 17 Phase 4G] — Investment-to-Business Tracking — 2026-07-16

### New Files

- `create_investment_fund_usages_table.php`: Migration for investment_fund_usages table
- `InvestmentFundUsage.php`: Model with usable() MorphTo, scopeForEntry/Purchases/Expenses, usable_label accessor
- `InvestmentFundUsageService.php`: create(), delete(), linkedAmount(), remainingAmount(),
  getUsagesForEntry(), getAvailablePurchases(), getAvailableExpenses(), resolveUsable()
  — all business guards (approved withdrawal only, no duplicate usable, amount within limit)
- `InvestmentFundUsagePolicy.php`: viewAny/create/delete — no model parameter pattern
- `Step17Phase4GPermissionSeeder.php`: fund_usage.view/create/delete — Admin all, Staff view only
- `InvestmentFundUsageController.php`: store/destroy — cross-entry guard on destroy
- `fund-usage.d.ts`: FundUsage, FundUsageFormData, PurchaseOption, ExpenseOption,
  FundUsagePanelProps, FundUsageCan interfaces
- `FundUsagePanel.tsx`: Progress bar, linked/remaining summary, usages list, unlink SweetAlert2
- `LinkFundUsageModal.tsx`: Purchase/Expense type selector, auto-fill amount from usable,
  remaining amount cap validation

### Updated Files

- `routes/web.php`: fund-usages.store + fund-usages.destroy nested under capital-ledger
- `AppServiceProvider.php`: InvestmentFundUsage + InvestmentFundUsagePolicy registered
- `CapitalLedgerEntry` model: fundUsages() HasMany relation added
- `CapitalLedgerController::show()`: fundUsageData, availablePurchases, availableExpenses props added;
  fund_usage_create + fund_usage_delete added to can array
- `CapitalLedger/Show.tsx`: FundUsagePanel integrated — shows per approved withdrawal entry;
  FundUsageEntry interface + new props added to destructure

### New Table

- `investment_fund_usages`: capital_ledger_entry_id, partner_id (nullable), usable_type,
  usable_id, amount, note, created_by
  Indexes: (usable_type, usable_id), capital_ledger_entry_id

### Business Rules Enforced

- Fund usage only linkable to approved withdrawal entries (transaction_type=withdrawal, status=approved)
- One purchase/expense can only be linked once — duplicate check at service layer
- Linked amount cannot exceed withdrawal entry amount (partial linking allowed)
- One withdrawal → multiple fund usages (one-to-many)
- withTrashed() on usable resolution — soft-deleted purchases/expenses still visible
- partner_id auto-populated from entry.partner_id at link time

---

## [v2.9 — Step 17 Phase 4F] — Profit Calculation Engine — 2026-07-16

### New Files

- `ProfitCalculationStrategyInterface.php`: Contract for all strategies
- `FixedPercentStrategy.php`: fixed_percent rule_type calculation
- `ProductBasedStrategy.php`: product_based — SQL GROUP BY aggregation per partner assignment
- `CapitalBasedStrategy.php`: Legacy capital_based — backward compat only
- `MixedStrategy.php`: Composes FixedPercent + ProductBased strategies
- `ProfitCalculationEngine.php`: Dispatcher — source_type routing, batch eligibility + rule resolution
- `ProfitCalculationController.php`: GET profit-calculation/preview — AJAX JSON endpoint
- `profit-calculation.d.ts`: TypeScript interfaces for engine output
- `PartnerBasedPreviewTable.tsx`: Partner preview table with eligibility split + product breakdown expand
- `Step17Phase4FPermissionSeeder.php`: profit_calculation.preview permission

### Updated Files

- `routes/web.php`: profit-calculation.preview route added
- `Create.tsx`: source_type selector + partner-based preview integration
- `StoreProfitDistributionRequest.php`: source_type + partner item fields added (nullable)
- `ProfitDistributionController::store()`: partner-based item snapshot writing

### New Migrations

- `make_invested_amount_nullable_in_profit_distribution_items`
- `add_partner_fields_to_profit_distribution_items`: partner_id, profit_rule_id, profit_rule_snapshot, settlement_type
- `make_investment_id_nullable_in_profit_distribution_items`

### Known Issues (deferred to Phase 4H)

- `Edit.tsx`: React key warning — investment_id null for partner-based items
- `ProfitPaymentController`: 500 error on partner-based distribution payment — investment_id null
- Both will be fixed in Phase 4H when Show/Edit pages are updated for partner-based distributions

---

## [v2.8 — Step 17 Phase 4E] — Product Partner & Assignments — 2026-07-15

### New Table

- `partner_product_assignments`: partner_id, assignable_type (default 'product'),
  assignable_id, effective_from, effective_to (nullable), cost_return_enabled (bool),
  profit_share_percent (dec8,4), is_active, approved_by/approved_at (excluded from $fillable),
  created_by — no soft delete
  Indexes: (assignable_type, assignable_id), (partner_id, effective_from)

### New Model

- `PartnerProductAssignment`: scopeApproved/Pending/Active/CoveringSaleDate/CoveringPeriod,
  is_pending/is_approved/is_currently_active accessors, approve() business method,
  product() + partner() + createdBy() + approvedBy() BelongsTo relations (all withTrashed)

### New Policy

- `PartnerProductAssignmentPolicy`: viewAny/create/edit/approve/delete
  — no model parameter on any method (ArgumentCountError prevention, Phase 4B/4C/4D pattern)
  — delete() reuses edit permission

### New Service

- `PartnerProductAssignmentService`: create(), update(), approve(), delete(), deactivate(),
  getAssignmentsForProduct(), getAssignmentsForPartner()
  — update()/delete() block approved assignments with RuntimeException guard
  — getAssignmentsForProduct(): Phase 4F helper — coveringSaleDate() scope
  — getAssignmentsForPartner(): Phase 4F helper — coveringPeriod() scope
  — never duplicated in controllers or other services

### New Controller

- `PartnerProductAssignmentController`: store/update/approve/destroy
  — cross-partner guard: abort_unless($assignment->partner_id === $partner->id, 404)
  — update()/destroy() block approved assignments with early return
  — approve() uses forceFill()->save() via model's approve() method (Rule 66)
  — hard delete only (no restore route)

### New Seeder

- `Step17Phase4EPermissionSeeder`: product_assignment.view/create/edit/approve
  Admin all, Staff view only

### Updated Files

- Routes: product-assignments.store/update/approve/destroy nested inside partners group
  using prefix+name group pattern, before explicit CRUD routes
- `AppServiceProvider`: PartnerProductAssignmentPolicy registered via Gate::policy()
- `Partner` model: productAssignments() HasMany relation added
- `PartnerController::show()`: productAssignments eager load with appended accessors,
  products prop (active products only), assignmentCan array added
- `partner.d.ts`: PartnerProductAssignment, ProductOption, ProductAssignmentFormData,
  AssignmentCan interfaces added; PartnerShowProps updated with productAssignments,
  products, assignmentCan
- `partner-colors.ts`: ASSIGNMENT_STATUS_COLORS/LABELS, getAssignmentStatus() helper added

### New Frontend Components

- `CreateProductAssignmentModal.tsx`: product select, effective_from/to DatePickerInput,
  profit_share_percent input, cost_return_enabled checkbox with info box,
  pending approval info banner
- `EditProductAssignmentModal.tsx`: useEffect populates from assignment prop,
  date slice [0,10] for DatePickerInput, Number() wrap on profit_share_percent
- `ProductAssignmentsPanel.tsx`: three sections (pending/active/historical),
  approve SweetAlert2 (confirmButtonColor: #4f46e5), delete SweetAlert2 (#ef4444),
  empty state with create button

### Known Rules Established

- `PartnerProductAssignment` excludes approved_by/approved_at from $fillable —
  use forceFill()->save() via approve() model method (Rule 66 pattern)
- Pending assignments (approved_by IS NULL) invisible to Phase 4F engine —
  scopeCoveringSaleDate() and scopeCoveringPeriod() both filter whereNotNull('approved_by')
- getAssignmentsForProduct() and getAssignmentsForPartner() are Phase 4F entry points —
  never duplicate these queries in controllers or calculation engine directly
- Policy delete() reuses edit permission — no separate delete permission needed

---

## [v2.7 — Step 17 Phase 4D] — Settlement Config — 2026-07-15

### New Table

- `partner_settlement_configs`: partner_id, settlement_type (profit_only/cost_plus_profit/custom),
  payment_preference (cash/bank_transfer/adjustment/reinvestment),
  auto_cost_return (bool), notes, is_active, created_by — no soft delete

### New Model

- `PartnerSettlementConfig`: scopeActive(), settlement_type_label + payment_preference_label accessors,
  partner() + createdBy() BelongsTo with withTrashed()

### New Policy

- `PartnerSettlementConfigPolicy`: viewAny/create/edit/delete
  — no model parameter on any method (ArgumentCountError prevention, Phase 4B/4C pattern)

### New Service

- `SettlementCalculationService`: calculate(), getActiveConfig(), hasActiveConfig(),
  getSettlementType(), getPaymentPreference()
  — calculateCostReturn() placeholder with full SQL documented; Phase 4F fills it in
  — engine contract respected: never writes to database, returns array only

### New Controller

- `PartnerSettlementConfigController`: store/update/destroy
  — one active config per partner enforced in store()
  — cross-partner guard: abort_unless($config->partner_id === $partner->id, 404)
  — hard delete only (no restore route)

### New Seeder

- `Step17Phase4DPermissionSeeder`: settlement_config.view/create/edit/delete
  Admin all, Staff view only

### Updated Files

- Routes: settlement-configs.store/update/destroy nested inside partners group
  with correct {partner} segment in URI
- `AppServiceProvider`: PartnerSettlementConfigPolicy registered via Gate::policy()
- `Partner` model: settlementConfigs() HasMany relation added; PartnerSettlementConfig imported
- `PartnerController::show()`: settlementConfigs eager load + settlementConfigCan array added
- `partner.d.ts`: SettlementType, PaymentPreference, PartnerSettlementConfig,
  SettlementConfigFormData, SettlementConfigCan added;
  PartnerShowProps updated with settlementConfigs + settlementConfigCan
- `partner-colors.ts`: SETTLEMENT_TYPE_COLORS/LABELS, PAYMENT_PREFERENCE_COLORS/LABELS added;
  import block updated with SettlementType + PaymentPreference types

### New Frontend Components

- `SettlementConfigPanel.tsx`: active config card with badges, inactive config history,
  empty state with create button, edit/delete actions
- `CreateSettlementConfigModal.tsx`: radio card settlement type selector,
  payment preference select, auto_cost_return conditional checkbox (cost_plus_profit only),
  notes textarea
- `EditSettlementConfigModal.tsx`: useEffect populates from config prop,
  same field layout as create modal

### Known Rules Established

- One active settlement config per partner — store() returns error if active config exists
- auto_cost_return resets to false when switching away from cost_plus_profit in frontend
- SettlementCalculationService::calculate() falls back to profit_only/cash when no config set
- calculateCostReturn() is a placeholder until Phase 4E partner_product_assignments exists

---

## [v2.6 — Step 17 Phase 4C] — Profit Eligibility — 2026-07-14

### New Table

- `partner_profit_eligibilities`: partner_id, profit_start_date, profit_end_date (null=ongoing),
  status (active/paused/ended), pause_reason, paused_by/at, resumed_by/at, created_by

### New Model

- `PartnerProfitEligibility`: scopeActive/Paused/Ended/CoveringPeriod,
  is_active/is_paused/is_ended/is_ongoing accessors, all user relations with withTrashed()

### New Service

- `PartnerEligibilityService`: isEligible(), isEligibleBatch(), getActiveRecord(),
  hasActiveEligibility(), create(), pause(), resume(), end()
  — isEligible() is the authoritative method for Phase 4F engine

### New Policy

- `PartnerEligibilityPolicy`: viewAny/create/pause/resume/end
  — no model parameter on any method (ArgumentCountError prevention)
  — end() reuses eligibility.pause permission

### New Controller

- `PartnerEligibilityController`: store, pause, resume, end
  — abort_unless($eligibility->partner_id === $partner->id, 404) cross-partner guard

### New Seeder

- `Step17Phase4CPermissionSeeder`: eligibility.view/create/pause/resume
  Admin all, Staff view only

### Updated Files

- `Partner` model: eligibilities() HasMany relation added
- `PartnerController::show()`: eligibilities eager load + eligibilityCan array added
- `AppServiceProvider`: PartnerEligibilityPolicy registered
- Routes: eligibilities.store/pause/resume/end nested inside partners group
- `partner.d.ts`: EligibilityStatus, PartnerEligibility, EligibilityFormData,
  PauseEligibilityFormData, ResumeEligibilityFormData, EligibilityCan added;
  PartnerShowProps updated with eligibilities + eligibilityCan
- `partner-colors.ts`: ELIGIBILITY_STATUS_COLORS/LABELS added

### New Frontend Components

- `CreateEligibilityModal.tsx`: profit_start_date, profit_end_date (optional)
- `PauseEligibilityModal.tsx`: pause_reason mandatory (min 5 chars), amber warning box
- `ResumeEligibilityModal.tsx`: resume_date (defaults today), new end date optional,
  info box explains new record creation
- `EligibilityPanel.tsx`: active record card, paused banner with resume button,
  history list with full audit trail

### Bug Fixed

- Route name in frontend must include `backend.` prefix:
  `backend.partners.eligibilities.store` not `partners.eligibilities.store`

### Known Rules Established

- Nested route names always include outer group prefix — verify with
  `php artisan route:list --name=` before using in frontend components
- Resume creates a NEW eligibility record — never mutates old paused record back to active
- One active eligibility record per partner enforced at service layer (create() throws RuntimeException)
- PartnerEligibilityService::isEligible() is the single authoritative eligibility check —
  Phase 4F engine calls this directly, no duplicate query logic elsewhere

---

## [v2.5 — Step 17 Phase 4B] — Profit Rules + Versioning — 2026-07-14

### New Tables

- `partner_profit_rules`: rule_type, profit_source, share_percent (decimal 8,4),
  effective_from, effective_to (null = active), approved_by/approved_at (excluded from $fillable)
- `partner_profit_rule_history`: append-only audit table, change_type enum,
  previous_value/new_value JSON

### New Models

- `PartnerProfitRule`: scopeApproved/Pending/ActiveAt, getIsPendingAttribute,
  getIsApprovedAttribute, getIsCurrentlyActiveAttribute, approve() + recordCreatedHistory()
    - recordUpdatedHistory() business logic methods
- `PartnerProfitRuleHistory`: append-only, no SoftDeletes

### New Policy

- `PartnerProfitRulePolicy`: viewAny/create/edit/approve — approve() separate from edit()
  No model parameter on any method (ArgumentCountError prevention)

### New Controller

- `PartnerProfitRuleController`: store/update/approve/destroy
  update() blocks approved rules, destroy() blocks approved rules

### New Service

- `PartnerRuleResolutionService`: resolve() single partner, resolveForPartners() batch,
  hasActiveRule() validation helper, getRuleHistory() display helper

### New Seeder

- `Step17Phase4BPermissionSeeder`: profit_rule.view/create/edit/approve —
  Admin gets all 4, Staff gets view only

### Updated Files

- `Partner` model: profitRules() HasMany relation added, PartnerProfitRule import added
- `PartnerController::show()`: profitRules eager load with append accessors, profitRuleCan array
- `partner.d.ts`: RuleType, ProfitSource, RuleChangeType types, PartnerProfitRule,
  PartnerProfitRuleHistory, ProfitRuleFormData, ProfitRuleCan interfaces added
- `partner-colors.ts`: RULE_TYPE_COLORS/LABELS, PROFIT_SOURCE_COLORS/LABELS,
  RULE_CHANGE_TYPE_COLORS/LABELS added
- Routes: profit-rules nested inside partners prefix group

### New Frontend Components

- `ProfitRulesPanel.tsx`: ActiveRuleCard, PendingRuleCard, HistoricalRuleCard sub-components,
  approve/delete SweetAlert2 confirms
- `CreateProfitRuleModal.tsx`: rule_type, profit_source, share_percent, effective_from, reason
- `EditProfitRuleModal.tsx`: pending rules only, useEffect populate, date slice [0,10]
- `RuleHistoryDrawer.tsx`: z-[60], timeline UI, all rules history merged + sorted

### Bug Fixes

- Migration typo: `partner_profi_rules` → `partner_profit_rules` (filename + Schema::create)
- FK constraint failure: history table migration failed due to parent table name typo
- Accessor not serialized: added ->each(fn($rule) => $rule->append([...])) in controller
- profit_rule.approve not working: Gate::before() bypass fails for class-string checks —
  permission must be explicitly assigned to role via seeder

### Known Rules Established

- Accessors must be appended explicitly — never rely on auto-serialization
- Gate::before() bypass unreliable for class-string Gate::allows() — always assign explicitly
- Migration filename must match Schema::create() table name exactly

---

## [v2.4 — Step 17 Phase 4A] — Partner Domain Foundation — 2026-07-14

### New Tables

- `partners`: name, code (PTR-001 auto-generated), partner_type_capital/working/product (boolean flags), phone, email, address, user_id (optional system user link), note, is_active, created_by, updated_by, soft deletes
- `partner_investments`: partner_id, investment_id, is_primary, note — UNIQUE(partner_id, investment_id), hard delete only

### New Models

- `Partner`: SoftDeletes, generateCode() PTR-001 format with withTrashed() scan, BelongsToMany investments via partner_investments, getTypeLabelsAttribute, getHasTypeAttribute
- `PartnerInvestment`: no SoftDeletes, withTrashed() on both relations

### New Policy

- `PartnerPolicy`: viewAny/view/create/update/delete/restore/forceDelete — forceDelete requires Super Admin role explicitly

### New Controller

- `PartnerController`: index (paginated + search/type/status/trashed filters + stats), show (eager loads investments with pivot id), store (generateCode auto), update, destroy (soft), restore (onlyTrashed), forceDelete (cascades partnerInvestments first), bulkAction (delete/restore/force_delete), linkInvestment (duplicate check + is_primary cascade), unlinkInvestment

### New Seeder

- `Step17Phase4APermissionSeeder`: partners.view/create/edit/delete/restore — Admin all, Staff view only

### New Routes

- bulk-action, restore, force-delete declared BEFORE resource routes
- link-investment (POST), unlink-investment (DELETE) routes added

### New Frontend

- `Backend/Partners/Index.tsx`: stats cards, filters (search/type/status/trashed), bulk actions bar, table with type badges, pagination
- `Backend/Partners/Show.tsx`: lg:grid-cols-3 layout, partner info, linked investments, status/types/audit sidebar
- `_components/CreatePartnerModal.tsx`: name, 3 type checkboxes, phone, email, address, note, status
- `_components/EditPartnerModal.tsx`: useEffect populates from partner prop, code shown in header
- `_components/LinkedInvestmentsCard.tsx`: pivot id fix (withPivot('id')), amount Number() wrap, footer totals, unlink confirm
- `_components/LinkInvestmentModal.tsx`: unlinked investments only, is_primary cascade warning, preview card

### New Types

- `partner.d.ts`: Partner, PartnerInvestment, PartnerLinkedInvestment (pivot.id included), InvestmentOption, PartnerFilters, PartnerStats, PartnerCan, PartnerPaginatedData, PartnerIndexProps, PartnerShowProps, PartnerFormData, LinkInvestmentFormData
- `partner-colors.ts`: PARTNER_TYPE_COLORS, PARTNER_TYPE_LABELS, PARTNER_STATUS_COLORS, INVESTMENT_STATUS_COLORS, getPartnerTypes() helper

### Sidebar

- New "Partners" nav group added after Investments, before Reports

### Bug Fixes

- Unlink 404: withPivot('id') added to show() eager load — pivot row id now available as investment.pivot.id
- CSP [::1] warning: vite.config.js host: 'localhost' set

### Architecture Notes

- Partner is the central PROFIT entity — capital entity remains Investment (unchanged)
- forceDelete cascade: partnerInvestments deleted first — Phase 4B+ tables to be added to cascade sequence
- Super Admin bypass via Gate::before() in AppServiceProvider — forceDelete additionally checked explicitly in policy

---

## [v2.3 — Architecture] — Financial Architecture Redesign — 2026-07-13

### Financial Domain Redesign (Documentation Only — No Code Yet)

- Separated financial system into two independent domains: Capital (Investment entity) and Profit (Partner entity)
- Capital amount from investments.amount is permanently decoupled from profit share calculation
- Partner introduced as the central profit entity replacing investment-based profit sharing
- Partner types: capital, working, product (non-exclusive boolean flags, combinable)
- Profit Rules: manually configured share_percent per partner, independent of capital amount
- Profit Rule Versioning: effective_from + effective_to date-based versioning, old rules never deleted
- Profit Rule Approval Workflow: pending rules (approved_by IS NULL) invisible to calculation engine
- Profit Eligibility: completely independent of capital status — configurable start/end/pause/resume
- Product Partner support: cost_return + profit_share settlement model
- Product Assignments: polymorphic assignable_type/id — individual products now, categories/brands future
- Settlement Engine: profit_only / cost_plus_profit / custom strategies per partner type
- Profit Calculation Engine: Strategy Pattern — FixedPercentStrategy, ProductBasedStrategy, CapitalBasedStrategy (legacy), MixedStrategy
- profit_distributions.source_type: investment_based (legacy) / partner_based (new) coexist permanently
- Historical backward compatibility: all new columns nullable on existing tables, no existing data modified
- investment_fund_usages: redesigned to be partner-aware (capital_ledger_entry → purchase/expense link)
- partner_profit_rule_history: append-only audit table for all rule changes

### New Tables Designed (not yet migrated)

```
partners
partner_investments
partner_profit_rules
partner_profit_rule_history
partner_profit_eligibilities
partner_product_assignments
partner_settlement_configs
investment_fund_usages
```

### Existing Tables — New Columns Designed (not yet migrated)

```
investments.partner_id (FK partners nullable)
profit_distributions.source_type (enum: investment_based/partner_based)
profit_distribution_items.partner_id (FK partners nullable)
profit_distribution_items.profit_rule_id (FK partner_profit_rules nullable)
profit_distribution_items.profit_rule_snapshot (json nullable)
profit_distribution_items.settlement_type (enum nullable)
investor_profit_balances.partner_id (FK partners nullable)
capital_ledger_entries.partner_id (FK partners nullable)
investor_capital_balances.partner_id (FK partners nullable)
```

### Documentation Updated

- MASTER_CONTEXT.md: new domain overview, pending module list restructured into Phase 4A–4H
- PROJECT_RULES.md: Partner Domain Rules (Rule 17) + Profit Calculation Engine Rules (Rule 18) added
- DATABASE_SCHEMA.md: all new tables documented, existing table modifications noted
- BUSINESS_RULES.md: complete rewrite of profit rules, partner rules, eligibility, settlement, calculation engine
- ARCHITECTURE.md: financial domain architecture section added, strategy pattern documented
- CHANGELOG.md: this entry

---

## [v2.2] — Step 17 Phase 3 — 2026-07-13

### Investor Statements

- InvestorStatementController: index (all investors summary), show (full statement), pdf (dompdf export)
- Read-only module — no mutations, no separate Policy (Gate::allows() directly)
- show() uses eager loading for all 4 relations to avoid N+1
- Index page: all investors with capital + profit summary, footer totals
- Show page: Investment Info, CapitalSummaryCard, ProfitSummaryCard, DistributionHistoryTable, CapitalTransactionTable
- CapitalSummaryCard: hero balance + breakdown rows + net check footer
- ProfitSummaryCard: pending balance hero + settlement progress bar
- DistributionHistoryTable: distribution status + payment status columns, empty state, footer totals
- CapitalTransactionTable: credit/debit split columns, Balance After (running_balance), cancelled rows dimmed
- PDF: A4 portrait, 4 sections, DejaVu Sans, flexbox+tables (no CSS Grid), fixed footer with page number
- investor-statement.d.ts: all TypeScript interfaces for statement data
- investor-statement-colors.ts: runtime color maps (separate from .d.ts — .d.ts cannot hold runtime values)
- Step17Phase3PermissionSeeder: investor_statement.view + export (Admin only)
- Sidebar: Investor Statements link under Investments group

### Bug Fixes

- ProfitDistributionItem: profitDistribution() BelongsTo relation was missing — added (duplicate of distribution() with explicit name for eager loading in InvestorStatementController)
- investor-statement.d.ts: PAYMENT_STATUS_COLORS / CAPITAL_TX_COLORS / CAPITAL_TX_DIRECTION_COLORS moved to investor-statement-colors.ts — .d.ts files cannot export runtime const values, Vite cannot resolve them

### Known Architectural Notes

- investor-statement-colors.ts rule: color map constants must live in .ts not .d.ts
- WithTrashed not needed on Investment in index() — withTrashed() already applied before load

---

## [v2.1] — Step 17 Phase 2 — 2026-07-12

### Capital Ledger

- capital_ledger_entries table: deposit/withdrawal/reinvestment/adjustment entries with running balance
- investor_capital_balances table: denormalized balance per investor (1:1 with investments)
- InvestorCapitalBalanceSeeder: seeds initial deposit from existing investments.amount
- CapitalLedgerController: index (all investors summary), show (per-investor ledger), store (deposit/adjustment/withdrawal request)
- CapitalWithdrawalController: approve (balance deducted only here), reject, cancel
- CapitalLedgerPolicy: view/deposit/adjust/withdrawal.request/withdrawal.approve
- Step17Phase2PermissionSeeder: Admin all, Staff view only
- Phase 1 → Phase 2 bridge: ProfitPaymentController reinvest action now credits InvestorCapitalBalance + creates CapitalLedgerEntry in same DB transaction
- Frontend: CapitalLedger/Index.tsx (summary table), Show.tsx (ledger + pending withdrawals), DepositModal, WithdrawalModal, AdjustmentModal, WithdrawalApprovalModal, LedgerTable
- Sidebar: Capital Ledger nav link under Investments group

### Bug Fixes

- ProfitDistribution.getPaidItemsCountAttribute: now counts deferred/reinvested/cancelled as settled
- ProfitDistribution.getTotalPaidAmountAttribute: now sums paid/deferred/reinvested
- InvestorProfitBalance.reverseEarned: guard prevents negative pending_balance
- ProfitDistributionItem.cancelPayment: REOPENED status now reverses payment correctly
- Investment model: profitBalance/capitalBalance/distributionItems/capitalLedgerEntries relations added
- ProfitDistributionController.distribute: RuntimeException now returns user-friendly error instead of 500
- ProfitPaymentController: axios replaces fetch for CSRF compatibility with SESSION_ENCRYPT=true
- CapitalLedgerEntry.$fillable: status field added to fix withdrawal pending status bug
- ProfitDistributionController.show: items now include remaining_amount/effective_amount/total_paid/isFullySettled via setAttribute

---

## [v2.0] — Step 17 Phase 1 — 2026-07-11

### Advanced Profit Distribution

- Investor eligibility tracking per distribution period with admin override
- InvestorProfitBalance ledger: earned/paid/deferred/reinvested/pending per investor
- ProfitDistributionItemPayment: full payment lifecycle (partial/paid/deferred/reinvested/cancelled/reopened)
- Extended ProfitDistributionItem: distribution_percent per investor, deferred/reinvested amounts, carry-forward
- ProfitPaymentController: pay/defer/reinvest/cancel/reopen payment actions (JSON responses)
- DistributionReverseController: reverse approved/distributed distributions back to draft
- InvestorBalanceController: index + show with recharts AreaChart earnings visualization
- New components: EligibilityPanel, ExtendedPaymentModal, PaymentHistoryModal, ReverseDistributionModal
- New pages: InvestorBalances/Index.tsx, InvestorBalances/Show.tsx
- Step17PermissionSeeder: eligibility/reverse/payment/investor_balance.view (Admin only)
- Mantine UI v8 installed: @mantine/core/dates/carousel/charts/tiptap + dayjs

### Critical Bug Fixes

- forceFill()->save() required for payment_status and distribution status transitions (mass assignment guard)
- ProfitDistribution.approve()/distribute()/reverse() converted to forceFill
- ProfitDistributionItem.syncPaymentStatus() converted to forceFill
- InvestorBalanceController.show() uses separate withTrashed() load after pagination (eager load limitation)
- Show.tsx Ziggy route fixed: named parameter `{ profit_distribution: id }` required

---

## [v1.9] — Step 16 — 2026-07-09

### Reports

- ReportController: 7 report types + single export() dispatcher
- Reports: Sales, Purchases, Expenses, ProfitLoss, Inventory, CustomerLedger, Investments
- PDF via dompdf (DejaVu Sans, flexbox, A4 landscape); CSV via streamDownload; Excel via maatwebsite
- ReportFilters.tsx + ExportBar.tsx shared components
- Step16PermissionSeeder: report.view (Admin+Staff), report.export (Admin only)

### Security

- SecurityHeaders middleware (CSP, X-Frame-Options, X-XSS-Protection, Referrer-Policy)
- ValidateSortColumn middleware with per-module column allowlists
- Session security: SESSION_ENCRYPT=true, HTTP_ONLY=true, SAME_SITE=lax
- Rate limiting on pos.sales.store, invoices.pdf, investments.export, reports.export, settings.logo

---

## [v1.8] — Step 15 — 2026-07-08

### Dashboard & Analytics

- Single AJAX endpoint GET /backend/dashboard/data returning all KPIs in one response
- Auto chart granularity: daily for ≤60 day ranges, monthly for >60 days
- recharts ComposedChart (Sales trend: Bar+Line), PieChart (payment/expense breakdown)
- 13 dashboard components: PeriodFilter, FinancialSummary, SalesChart, SalesAnalytics,
  SalesAnalyticsChart, ExpenseBreakdown, InventoryPanel, CustomerAnalytics, ProductAnalytics,
  NeedsAttention, RecentActivities, NotificationsPanel, RecentSales
- NeedsAttention returns null when all counts zero (no empty amber box)
- HandleInertiaRequests shares globally: auth.user, flash, ziggy, notifications

---

## [v1.7] — Step 14 — 2026-07-07

### Profit Distribution

- Snapshot accounting: financial figures frozen at distribution time
- calculatePreview() AJAX endpoint: revenue, COGS, expenses, per-investor shares
- approve() locks distribution (is_locked=true); distribute() validates all items settled
- generateDistributionNo(): PD-YYYY-000001 with lockForUpdate() inside DB::transaction()
- ProfitDistributionItem: per-investor share snapshot, markAsPaid/markAsCancelled
- Step14PermissionSeeder: view/create/edit/delete/restore/approve

---

## [v1.6] — Step 13 — 2026-07-07

### Investment Management

- Investment model with SoftDeletes, attachment (image/pdf/doc/xlsx), status tracking
- attachment_url accessor must be appended explicitly
- Export: CSV (native), Excel (InvestmentExport via maatwebsite), PDF (dompdf)
- buildExportQuery() private method for shared filter logic
- show() passes investmentTypes prop for edit modal
- Step13PermissionSeeder

---

## [v1.5] — Step 12 — 2026-07-07

### Expense Management

- Expense model with SoftDeletes, attachment, no approval workflow (no status column)
- ExpenseController with bulk action (delete/restore) and individual restore
- Step12PermissionSeeder

---

## [v1.4] — Step 11 — 2026-07-06

### Hold Orders

- HoldOrder + HoldOrderItem: ephemeral POS data, hard delete only (no soft delete, no restore)
- Lifecycle: active → processing (on resume) → hard delete after successful Sale
- release() reverts processing → active on failure/cancel
- HoldOrderController uses AuthorizesRequests + $this->authorize('edit', $holdOrder)
- CartSidebar Hold Order button (blue-300 border); HoldOrdersDrawer (right slide panel)
- Step11PermissionSeeder

---

## [v1.3] — Step 10 — 2026-07-06

### Invoice & Receipt

- InvoiceController reuses sales + sale_items + business_settings (no new tables)
- PDF via barryvdh/laravel-dompdf; logo uses public_path() (not URL)
- DomPDF limitation: CSS Grid not supported — flexbox only
- InvoicePrintView component for browser print
- Step10PermissionSeeder

---

## [v1.2] — Step 09 — 2026-07-05

### POS / Cart / Sale

- SaleController.store() returns JSON {id, reference_no} — not redirect (axios.post in frontend)
- SaleStockService: stock reversal on sale delete via reverseStock()
- ProductGrid with barcode, images, discount support
- ProductDetailModal: image slider (Mantine Carousel), price with discount, add to cart
- CartItem leave animation via onTransitionEnd
- ReceiptModal post-checkout
- Step09PermissionSeeder: Admin all, Staff sale.view + sale.create

---

## [v1.1] — Step 08 — 2026-07-05

### Customer Management

- Customer model with SoftDeletes and restore
- opening_balance: historical balance only (not related to current orders)
- Step08PermissionSeeder

---

## [v1.0] — Steps 00–07 — 2026-06-30

### Foundation

- Step 00: Project standards finalized (naming, folder structure, permission strategy)
- Step 01: Laravel 12 + Breeze (React+Inertia+TypeScript), Tailwind v4, Spatie Permission, Ziggy
- Step 02: Auth, User CRUD, Roles & Permissions, Login History, Activity Log, RecordLoginHistory listener
- Step 03: BusinessSettings (key-value), PaymentMethods, ExpenseCategories, InvestmentTypes
- Step 04: ProductCategories (self-referential), Units, Products (full spec), ProductImages
- Step 05: Notification system (UUID PK, DatabaseNotification), unread count in HandleInertiaRequests
- Step 06: Supplier management with restore
- Step 07: Purchase + PurchaseItems + PurchasePayments, StockMovement (polymorphic),
  PurchaseStockService (weighted average cost), SaleStockService
