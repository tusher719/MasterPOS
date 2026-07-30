# Master Business Suite — Master Context

> Paste this file at the start of every new chat.
> See "Which Files to Paste" section for chat-specific guidance.

---

## Which Files to Paste (Token Guide)

| Chat Type                       | Files to Paste                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Sprint 1–4 active work          | MASTER_CONTEXT + PROJECT_RULES + DATABASE_SCHEMA + BUSINESS_RULES + ARCHITECTURE + GAPS_PART_B_CORE  |
| Sprint 1–4 + history needed     | Above 6 + GAPS_PART_A                                                                                |
| Sprint 5+ work                  | MASTER_CONTEXT + PROJECT_RULES + DATABASE_SCHEMA + BUSINESS_RULES + ARCHITECTURE + GAPS_PART_B_LATER |
| Database/schema question        | Always include DATABASE_SCHEMA                                                                       |
| Bug fix / architecture question | Add ARCHITECTURE + GAPS_PART_A                                                                       |
| CHANGELOG update                | Add CHANGELOG                                                                                        |

---

## Project Identity

- **Name:** Master Business Suite
- **Version:** v2.22
- **Path:** D:/xampp/htdocs/Laravel_12/MasterPOS
- **Environment:** Windows 10, XAMPP, Git Bash

## Tech Stack

| Layer       | Technology                                                                     |
| ----------- | ------------------------------------------------------------------------------ |
| Backend     | Laravel 12                                                                     |
| Frontend    | React 18 + Inertia.js + TypeScript                                             |
| Styling     | Tailwind CSS (primary) + Mantine UI v8 (selective — see PROJECT_RULES Rule 11) |
| Routing     | Ziggy                                                                          |
| Permissions | Spatie laravel-permission                                                      |
| PDF         | barryvdh/laravel-dompdf                                                        |
| Charts      | recharts (bundled) + @mantine/charts (investor/capital/partner pages only)     |
| Toast       | sonner                                                                         |
| Confirm     | SweetAlert2                                                                    |
| Icons       | lucide-react                                                                   |
| Excel       | maatwebsite/excel                                                              |

## Current Status

- **Current Step:** Sprint 1 — Foundation & Safety (In Progress)
- **Last Completed:** Item 1.1 — Settings Dynamic Fix ✅

## Financial Domain Overview

| Domain  | Central Entity    | Tracks                                  |
| ------- | ----------------- | --------------------------------------- |
| Capital | Investment        | Money entering and leaving the business |
| Profit  | Partner           | Profit entitlement, rules, distribution |
| Link    | PartnerInvestment | Which partner owns which investment     |

> Capital and Profit are ALWAYS independent. Investment amount NEVER determines profit share.

## Completed Modules

| Step        | Module                                              | Status |
| ----------- | --------------------------------------------------- | ------ |
| 00          | Project Standards                                   | ✅     |
| 01          | Project Foundation                                  | ✅     |
| 02          | Authentication & Permission                         | ✅     |
| 03          | Business Settings                                   | ✅     |
| 04          | Product & Category Management                       | ✅     |
| 05          | Notification System                                 | ✅     |
| 06          | Supplier Management                                 | ✅     |
| 07          | Purchase & Inventory                                | ✅     |
| 08          | Customer Management                                 | ✅     |
| 09          | POS (Cart/Sale)                                     | ✅     |
| 10          | Invoice & Receipt                                   | ✅     |
| 11          | Hold Orders                                         | ✅     |
| 12          | Expense Management                                  | ✅     |
| 13          | Investment Management                               | ✅     |
| 14          | Profit Distribution                                 | ✅     |
| 15          | Dashboard & Analytics                               | ✅     |
| 16          | Reports                                             | ✅     |
| 17 Phase 1  | Advanced Profit Distribution                        | ✅     |
| 17 Phase 2  | Capital Ledger                                      | ✅     |
| 17 Phase 3  | Investor Statements                                 | ✅     |
| 17 Phase 4A | Partner Domain Foundation                           | ✅     |
| 17 Phase 4B | Profit Rules + Versioning                           | ✅     |
| 17 Phase 4C | Profit Eligibility                                  | ✅     |
| 17 Phase 4D | Settlement Config                                   | ✅     |
| 17 Phase 4E | Product Partner & Assignments                       | ✅     |
| 17 Phase 4F | Profit Calculation Engine                           | ✅     |
| 17 Phase 4G | Investment-to-Business Tracking                     | ✅     |
| 17 Phase 4H | Existing Table Migrations                           | ✅     |
| 4.4 + 4.5   | Duplicate Prevention + Per-Partner Effective Period | ✅     |
| 2.2         | Settlement Config Approval Columns                  | ✅     |
| 2.1         | Partner Type ↔ Rule Validation                      | ✅     |
| 2.5         | Verify Deactivated Partner Guard                    | ✅     |
| 4.1         | Capital Principal Lock + Partial Unlock             | ✅     |
| 4.2         | Product Partner Cost/Profit Split                   | ✅     |
| 1.5         | Investment/Partner Show Page Financial Summary      | ✅     |
| 1.2         | Investor Statement — Partner Support                | ✅     |
| 2.4         | Mixed Rule Resolution clarification                 | ✅     |
| 1.3         | Distribution List — Source Type Badge & Filter      | ✅     |
| 1.4         | Partner Financial Overview page                     | ✅     |
| 2.3         | Mixed Partner per-type Settlement/Eligibility       | ✅     |
| 1.5         | Cascade Soft-Delete Correction                      | ✅     |
| 1.1         | Settings Dynamic Fix                                | ✅     |
| 3.3         | Product Variants                                    | ✅     |
| 3.4         | Secure Product Slug + POS min_sale_qty fix          | ✅     |
| 3.5         | Inventory Sync + Stock Reservation                  | ✅     |
| 5.1         | Payment Method Charge Config                        | ✅     |

## Pending Work — Sprint Order

### Sprint 1 — Foundation & Safety (Current)

| #   | Item                                | Priority | Migration? |
| --- | ----------------------------------- | -------- | ---------- |
| 5.2 | Individual Bank under Bank Transfer | Must Fix | Yes        |

### Sprint 2 — Sales/Delivery/Payment Core

| #   | Item                              | Priority   |
| --- | --------------------------------- | ---------- |
| 4.1 | Order Status Workflow             | Must Fix   |
| 4.2 | Delivery Details                  | Must Fix   |
| 4.3 | Multi-Payment (sale_payments)     | Must Fix   |
| 4.4 | POS Payment Type Selection        | Must Fix   |
| 4.5 | COD Delivery + Payment Collection | Must Fix   |
| 4.6 | Courier Manual Fields             | Must Fix   |
| 4.7 | Sales History Page                | Must Fix   |
| 4.8 | Sale Status History               | Must Fix   |
| 4.9 | Order Confirmation Email          | Should Fix |

### Sprint 3 — Fraud Protection

| #   | Item                        | Priority |
| --- | --------------------------- | -------- |
| 6.1 | Fraud Flags Core Table      | Must Fix |
| 6.2 | Layer 1 Form Validation     | Must Fix |
| 6.3 | Layer 2 IP Order Limit      | Must Fix |
| 6.4 | Layer 3 Success Ratio Check | Must Fix |
| 6.5 | Order-Blocked Popup         | Must Fix |

### Sprint 4 — Fulfillment Ops

| #   | Item                          | Priority   |
| --- | ----------------------------- | ---------- |
| 8.1 | Order Task System             | Must Fix   |
| 8.2 | Staff Performance Report      | Should Fix |
| 8.3 | Pre-Order/Booking System      | Should Fix |
| 3.8 | Product Planning Task Manager | Should Fix |

### Sprint 5 — Admin Polish

| #    | Item                              | Priority     |
| ---- | --------------------------------- | ------------ |
| 1.2  | Dynamic Navbar Logo               | Should Fix   |
| 1.3  | Admin Panel Theme (per-user)      | Should Fix   |
| 1.4  | Global Trash Bin Page             | Should Fix   |
| 1.6  | Dynamic Notifications             | Should Fix   |
| 1.7  | Split Dashboards                  | Should Fix   |
| 1.8  | Live Login Status                 | Should Fix   |
| 1.9  | Global Search Ctrl+K              | Should Fix   |
| 1.10 | Audit Trail Viewer UI             | Should Fix   |
| 1.11 | PDF/Print Branding                | Should Fix   |
| 1.14 | Fallback / 404 Pages (3 surfaces) | Should Fix   |
| 1.15 | App Launcher Popup (Quick Links)  | Nice to Have |
| 1.16 | System Status Pages               | Should Fix   |
| 1.17 | Privacy Policy & Terms Pages      | Should Fix   |
| 1.18 | Dynamic Navbar Badges             | Nice to Have |
| 1.19 | Nested/Collapsible Navigation     | Nice to Have |
| 1.20 | Dark Mode (two separate toggles)  | Should Fix   |
| 1.21 | Universal Image Upload Preview    | Should Fix   |
| 2.1  | Staff Email Verification Banner   | Must Fix     |
| 2.2  | Default Role Assignment           | Must Fix     |
| 2.3  | Optional 2FA                      | Nice to Have |

### Sprint 6 — Product/Inventory Extras

| #   | Item                            | Priority     |
| --- | ------------------------------- | ------------ |
| 3.1 | Product Search Autocomplete     | Should Fix   |
| 3.2 | Products Grid/List Toggle       | Nice to Have |
| 3.6 | Universal Import/Export         | Should Fix   |
| 3.7 | Purchase Return/Damage Tracking | Should Fix   |

### Sprint 7 — Customer Portal Foundation

| #   | Item                                | Priority   |
| --- | ----------------------------------- | ---------- |
| 9.1 | Website Customer Source Flag        | Should Fix |
| 9.2 | Secure Portal Access Invite         | Must Fix   |
| 9.3 | Customer Registration Auth Columns  | Should Fix |
| 8.1 | Business Payment Accounts Ledger    | Should Fix |
| 8.2 | Customer Spending Visibility        | Should Fix |
| 8.3 | Customer Ledger Opening Balance Fix | Should Fix |

### Sprint 8 — Storefront Build

| #     | Item                                      | Priority     |
| ----- | ----------------------------------------- | ------------ |
| 10.1  | Public Product Catalog                    | Must Fix     |
| 10.2  | Website Settings / CMS                    | Must Fix     |
| 10.3  | Add-to-Cart Animation + Responsiveness    | Should Fix   |
| 10.4  | Cart                                      | Must Fix     |
| 10.5  | Checkout (Login Required, Manual Payment) | Must Fix     |
| 10.6  | Manual Payment Verification               | Must Fix     |
| 10.7  | Website Product Search Premium            | Should Fix   |
| 10.8  | Recently Ordered Products                 | Should Fix   |
| 10.9  | Customer Profile + Order Tracking         | Must Fix     |
| 10.10 | Reviews & Wishlist UI                     | Should Fix   |
| 10.11 | SEO                                       | Should Fix   |
| 10.12 | Facebook Pixel Integration                | Should Fix   |
| 10.13 | Login Modal + Dedicated Page              | Must Fix     |
| 10.14 | Animated Widgets & Counters               | Nice to Have |

### Sprint 9 — Customer Engagement

| #   | Item                           | Priority   |
| --- | ------------------------------ | ---------- |
| 6.1 | Product Reviews Backend        | Must Fix   |
| 6.2 | Wishlist Backend               | Must Fix   |
| 6.3 | Coupon / Discount Code Engine  | Should Fix |
| 6.4 | Festival / Time-Bound Discount | Should Fix |
| 6.5 | Spinning Wheel                 | Should Fix |
| 6.6 | Abandoned Cart Recovery        | Should Fix |
| 6.7 | Email/SMS Notification Flow    | Should Fix |
| 6.8 | Loyalty Points System          | Should Fix |

### Sprint 10 — Employee/HR

| #    | Item                       | Priority     |
| ---- | -------------------------- | ------------ |
| 2.4  | Employee/User Profile Page | Should Fix   |
| 2.5  | Salary/Payroll Domain      | Should Fix   |
| 13.x | Attendance/Leave/Payroll   | Nice to Have |

### Sprint 11 — Phase 2 (Paid Services Only)

| #    | Item                       |
| ---- | -------------------------- |
| 11.1 | Automated Payment Gateway  |
| 11.2 | Courier API Integration    |
| 11.3 | External Fraud Network API |
| 11.4 | WhatsApp Business API      |

### Sprint 12 — Optional / As-Needed

| #     | Item                           |
| ----- | ------------------------------ |
| 12.1  | Supplier Ledger                |
| 12.2  | VAT/Tax Report                 |
| 12.3  | Double-Entry Accounting        |
| 12.4  | Backup & Restore               |
| 12.5  | Multi-language Toggle          |
| 12.6  | Custom Report Builder          |
| 12.7  | Business Analytics/Forecasting |
| 12.8  | Multi-Warehouse                |
| 12.9  | Customer Segments              |
| 12.10 | SLA Alert for Order Tasks      |
| 12.11 | Task Templates for Order Tasks |

## Deferred

| Step       | Module                   | Notes                       |
| ---------- | ------------------------ | --------------------------- |
| 17 Phase 5 | Sales Payment Upgrade    | Revisit after gaps resolved |
| 18         | Security Hardening       |                             |
| 19         | Performance Optimization |                             |
| 20         | Testing                  |                             |

## Documentation Files

| File                 | Purpose                                   | When to Paste                      |
| -------------------- | ----------------------------------------- | ---------------------------------- |
| MASTER_CONTEXT.md    | This file — identity, status, sprint list | Always                             |
| PROJECT_RULES.md     | Coding rules, UI standards, conventions   | Always                             |
| DATABASE_SCHEMA.md   | All tables, columns, relationships        | Always (especially DB work)        |
| CHANGELOG.md         | Implementation history                    | When updating changelog            |
| BUSINESS_RULES.md    | Domain logic — how the system works       | Always                             |
| ARCHITECTURE.md      | Architectural decisions — WHY             | Bug fix / architecture questions   |
| GAPS_PART_A.md       | Original POS-era gaps (all ✅ Done)       | History / Partner-domain questions |
| GAPS_PART_B_CORE.md  | Sprint 1–4 active features                | Sprint 1–4 work                    |
| GAPS_PART_B_LATER.md | Sprint 5–12 future features               | Sprint 5+ work                     |

## AI Usage Notes

- Always read ALL pasted documentation files before writing code
- PROJECT_RULES.md contains critical rules that prevent known bugs
- BUSINESS_RULES.md contains domain logic that must be respected
- ARCHITECTURE.md explains WHY decisions were made — do not override them
- DATABASE_SCHEMA.md is the single source of truth for column names
- Never assume column names from context — always verify
- Capital domain = Investment entity (complete — do not redesign)
- Profit domain = Partner entity (complete — do not redesign)
- Never couple capital amount to profit share calculation
- Storefront (Sprint 8) is a NEW separate frontend — NOT a modification of Backend Admin Panel

## Key Decisions Confirmed

### Online Business Expansion

- **Staff registration:** Admin creates all accounts manually — no public self-registration
- **Staff email verification:** Persistent banner after login, login not blocked, admin sees verified status
- **Refund flow:** Distinct refund entry in sale_payments (not negative ledger balance)
- **Discount stack order:** Festival/Product discount first → Coupon last (if coupon_stackable = true)
- **Delivery charge:** Added to customer total as separate line item, admin can set 0 (free delivery flag)
- **Payment method charge:** Configured in Settings → Payment Methods, applies dynamically everywhere
- **Individual bank charge:** payment_method_banks table — each bank has its own charge config
- **Coupon datetime:** starts_at + expires_at store datetime with time (not date only)
- **Stock reservation window:** Configurable via business_settings.stock_reservation_minutes (default: 30)
- **Product slug:** Auto-generated with 6-char random suffix, immutable after creation
- **Storefront checkout:** Login required to place order, guest browsing allowed
- **Storefront payment:** Manual bKash/Nagad verification (no gateway in Phase 1)
- **Product Planning Task:** Internal tool — multi-product add with quantity/cost/status
- **Storefront frontend:** Completely separate from Backend Admin Panel — own routes, layout, auth guard, page directory
- **Login flow:** Both modal (inline, preserves cart) + dedicated page (/login, /register)
- **Dark mode:** Two separate toggles — Admin Panel (per-user theme) vs Website (visitor session/cookie)

### Original System (4.4 + 4.5)

- **Overlap check:** Any overlap between periods triggers the check
- **Settled statuses:** paid, reinvested, deferred — all three count
- **Effective Period:** Effective Start = MAX(selected_start, eligibility_start, last_paid_up_to + 1 day)
- **Engine:** Financial summary computed once per unique Effective Period

```

```
