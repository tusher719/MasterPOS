# Master POS System — Master Context

> Paste this file + any other context files at the start of every new chat.
> All documentation files together form one combined project context.
> Never treat any single file as the complete context.

---

## Project Identity

- **Name:** Master POS System
- **Version:** v2.0
- **Path:** D:/xampp/htdocs/Laravel_12/MasterPOS
- **Environment:** Windows 10, XAMPP, Git Bash

## Tech Stack

| Layer       | Technology                                                 |
| ----------- | ---------------------------------------------------------- |
| Backend     | Laravel 12                                                 |
| Frontend    | React 18 + Inertia.js + TypeScript                         |
| Styling     | Tailwind CSS (primary) + Mantine UI v8 (selective)         |
| Routing     | Ziggy                                                      |
| Permissions | Spatie laravel-permission                                  |
| PDF         | barryvdh/laravel-dompdf                                    |
| Charts      | recharts (bundled) + @mantine/charts (investor pages only) |
| Toast       | sonner                                                     |
| Confirm     | SweetAlert2                                                |
| Icons       | lucide-react                                               |
| Excel       | maatwebsite/excel                                          |

## Current Status

- **Current Step:** Step 17 Phase 4 — Investment-to-Business Tracking (NOT STARTED)
- **Last Completed:** Step 17 Phase 3 — Investor Statements ✅

## Completed Modules

| Step       | Module                        | Status |
| ---------- | ----------------------------- | ------ |
| 00         | Project Standards             | ✅     |
| 01         | Project Foundation            | ✅     |
| 02         | Authentication & Permission   | ✅     |
| 03         | Business Settings             | ✅     |
| 04         | Product & Category Management | ✅     |
| 05         | Notification System           | ✅     |
| 06         | Supplier Management           | ✅     |
| 07         | Purchase & Inventory          | ✅     |
| 08         | Customer Management           | ✅     |
| 09         | POS (Cart/Sale)               | ✅     |
| 10         | Invoice & Receipt             | ✅     |
| 11         | Hold Orders                   | ✅     |
| 12         | Expense Management            | ✅     |
| 13         | Investment Management         | ✅     |
| 14         | Profit Distribution           | ✅     |
| 15         | Dashboard & Analytics         | ✅     |
| 16         | Reports                       | ✅     |
| 17 Phase 1 | Advanced Profit Distribution  | ✅     |
| 17 Phase 2 | Capital Ledger                | ✅     |
| 17 Phase 3 | Investor Statements           | ✅     |

## Pending Modules

| Step       | Module                          |
| ---------- | ------------------------------- |
| 17 Phase 4 | Investment-to-Business Tracking |
| 17 Phase 5 | Sales Payment Upgrade           |
| 17 Phase 6 | COD Support                     |
| 18         | Security Hardening              |
| 19         | Performance Optimization        |
| 20         | Testing                         |

## Documentation Structure

| File               | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| MASTER_CONTEXT.md  | This file — project identity, status, module list       |
| PROJECT_RULES.md   | All coding rules, UI standards, conventions             |
| DATABASE_SCHEMA.md | All tables, columns, relationships, constraints         |
| CHANGELOG.md       | Implementation history per version                      |
| BUSINESS_RULES.md  | Business logic — how the system works                   |
| ARCHITECTURE.md    | Architectural decisions — why things are built this way |

## AI Usage Notes

- Always read ALL documentation files before writing code
- PROJECT_RULES.md contains critical rules that prevent known bugs
- BUSINESS_RULES.md contains domain logic that must be respected
- ARCHITECTURE.md explains WHY decisions were made — do not override them
- DATABASE_SCHEMA.md is the single source of truth for column names
- When in doubt about a column name, check DATABASE_SCHEMA.md first
- Never assume column names from context — always verify
