# Master Business Suite — Project Overview & Architecture Status

**Project:** Master Business Suite (MasterPOS)  
**Version:** v2.0  
**Status:** In Active Comprehensive Audit & Hardening  
**Target Git Branch:** `tusher-v2`  
**Dev Environment:** Windows 10, XAMPP (PHP 8.2+, MySQL 8.0), Git Bash  
**Automated Testing Environment:** MySQL database (`masterpos_testing`) with `DatabaseTransactions`  

---

## 1. High-Level Architecture

MasterPOS is a full-featured, enterprise-grade Point of Sale (POS), Inventory, Finance, and Public eCommerce suite designed for retail and wholesale operations.

```
                    ┌──────────────────────────────────────────┐
                    │            Master Business Suite         │
                    └──────────────────────────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
│  Public Store    │           │   POS Terminal   │           │  Backend Admin   │
│  - Catalog       │           │  - Quick Sale    │           │  - Users/Roles   │
│  - Search (10.2) │           │  - Hold Orders   │           │  - Inventory     │
│  - Cart/Checkout │           │  - Thermal Print │           │  - Accounting    │
└──────────────────┘           └──────────────────┘           └──────────────────┘
```

---

## 2. Completed Architecture Milestones

- **Step 00–02:** Project Standards, Authentication, Roles & Permissions (Spatie), Login Histories, Activity Logs.
- **Step 03:** Dynamic Business Settings, Multi-Payment Methods, Expense Categories, Investment Types, Logo Upload.
- **Step 04–05:** Products, Categories, Units, Variants, Multi-Images, Barcodes, Inventory Stocks.
- **Step 06–07:** Purchases & Stock Inbound, Supplier Ledgers, Partial Receiving, Purchase Duplication.
- **Step 08–09:** Customer Ledgers, Hold Orders System, POS Terminal (80mm/58mm thermal receipts).
- **Step 10:** Sales Processing, Invoice Generation (DomPDF + Web Invoice), Payment Splitting.
- **Step 11–14:** Expenses, Investments, Investor Balances, Multi-tier Profit Distribution, Partner Capital Ledgers.
- **Step 15–16:** Real-time Business Analytics Dashboard, Modular Reports (Sales, Purchases, Inventory, P&L, Customer Ledgers) with Excel/PDF exports.
- **Sprint 6:** Universal Data Import/Export (Excel/CSV with background validation), Purchase Returns & Stock Reversals.
- **Sprint 8:** Public Storefront (Item 10.1 Catalog, Item 10.2 Search Page with Live AJAX & Filterable Product Cards).

---

## 3. Technology Stack

- **Backend:** Laravel 12.x
- **Frontend:** React 18 + Inertia.js + TypeScript
- **Styling & Theming:** Tailwind CSS v4, CSS Custom Properties (`--primary`, `--background`, `--card`, `--foreground`, etc.) with full Light and Dark mode support.
- **Permissions:** Spatie Laravel-Permission (`web` guard).
- **Icons & UI:** Lucide React, Sonner (toasts), SweetAlert2 (confirmations).
- **Reporting:** Recharts, Maatwebsite Excel, Barryvdh Laravel-DomPDF.
- **Testing:** PHPUnit 11 with dedicated MySQL testing database (`masterpos_testing`) and `DatabaseTransactions` isolation.

---

## 4. Coding & Design Standards

1. **Modals vs Pages:** Quick Create/Edit actions use Modals; complex multi-step workflows (Product Create/Edit, Purchase Order, Profit Distribution Wizard) use dedicated pages.
2. **Light & Dark Mode:** Never hardcode Tailwind grayscale colors (`bg-white`, `text-gray-900`, `border-gray-200`) without dark variants or semantic classes (`bg-card`, `text-foreground`, `border-border`, `bg-muted`).
3. **Controller Responses:** POS Store returns JSON (`{ id, reference_no }`) for smooth cart clearance without full-page reloads.
4. **Data Integrity:** Soft deletes on master entities (`User`, `Product`, `Customer`, `Supplier`, `Purchase`); hard delete on ephemeral POS entities (`HoldOrder`).
5. **Activity Logging:** Systematic audit logging on all mutations via `ActivityLogService`.
