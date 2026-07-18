# Master Business Suite — Master Context

> Paste this file + any other context files at the start of every new chat.
> All documentation files together form one combined project context.
> Never treat any single file as the complete context.

---

## Project Identity

- **Name:** Master Business Suite
- **Version:** v2.2
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

- **Current Step:** Gap 2.2 — Settlement Config Approval Columns
- **Next Step:** Gap 2.1 — Partner Type ↔ Rule Validation
- **Last Completed:** Gap 4.4 + 4.5 — Duplicate Prevention + Per-Partner Effective Period Resolution ✅

## Financial Domain Overview

The system is now organized into two independent financial domains:

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

## Pending Work — Gaps & Recommendations (Must Fix, in order)

| #   | Item                                           | Notes                                 |
| --- | ---------------------------------------------- | ------------------------------------- |
| 2.2 | Settlement Config Approval Columns             | Small migration, independent          |
| 2.1 | Partner Type ↔ Rule Validation                 | No migration, validation only         |
| 2.5 | Verify Deactivated Partner Guard               | Verify first, only build if missing   |
| 4.1 | Capital Principal Lock + Partial Unlock        | Core Capital domain change            |
| 4.2 | Product Partner Cost/Profit Separate Tracking  | Core Profit domain change             |
| 1.5 | Investment/Partner Show Page Financial Summary | Depends on 4.1 + 4.2 being done first |

## Deferred

| Step       | Module                   | Notes                                                 |
| ---------- | ------------------------ | ----------------------------------------------------- |
| 17 Phase 5 | Sales Payment Upgrade    | Deferred — revisit after gaps resolved, in flow order |
| 18         | Security Hardening       |                                                       |
| 19         | Performance Optimization |                                                       |
| 20         | Testing                  |                                                       |

## Documentation Structure

| File                        | Purpose                                                  |
| --------------------------- | -------------------------------------------------------- |
| MASTER_CONTEXT.md           | This file — project identity, status, module list        |
| PROJECT_RULES.md            | All coding rules, UI standards, conventions              |
| DATABASE_SCHEMA.md          | All tables, columns, relationships, constraints          |
| CHANGELOG.md                | Implementation history per version                       |
| BUSINESS_RULES.md           | Business logic — how the system works                    |
| ARCHITECTURE.md             | Architectural decisions — why things are built this way  |
| GAPS_AND_RECOMMENDATIONS.md | Confirmed gaps + new business rules, ordered by priority |

## AI Usage Notes

- Always read ALL documentation files before writing code
- PROJECT_RULES.md contains critical rules that prevent known bugs
- BUSINESS_RULES.md contains domain logic that must be respected
- ARCHITECTURE.md explains WHY decisions were made — do not override them
- DATABASE_SCHEMA.md is the single source of truth for column names
- GAPS_AND_RECOMMENDATIONS.md is the current work queue — follow its order
- When in doubt about a column name, check DATABASE_SCHEMA.md first
- Never assume column names from context — always verify
- Capital domain = Investment entity (Phase 2 complete — do not redesign)
- Profit domain = Partner entity (Phase 4 complete)
- Never couple capital amount to profit share calculation

## Key Decisions Confirmed (4.4 + 4.5)

- **Overlap check (Q2):** Option B — any overlap between periods triggers the check
  (`new.period_start <= existing.period_end AND new.period_end >= existing.period_start`)
- **Settled statuses (Q1):** `paid`, `reinvested`, `deferred` — all three count
- **Scope (Q3):** Both `investment_based` and `partner_based` distributions checked
- **UI label (Q4):** "Already Paid (from Distribution #PD-2026-000001)" format
- **Effective Period formula per partner:**
    ```
    Effective Start = MAX(selected_start, eligibility_start, last_paid_up_to + 1 day)
    Effective End   = MIN(selected_end, eligibility_end)
    If Effective Start > Effective End → partner fully ineligible
    ```
- **Engine change:** Financial summary (Revenue, COGS, Expenses) computed once per
  unique Effective Period, not once per distribution — partners sharing the same
  Effective Period reuse the same computed summary
