# Master POS System — Project Overview

## Vision
Admin-operated Master POS System (v1.0). Future-ready for Customer Portal,
Website, and Mobile App (v2.0/v3.0) without major redesign.

## Tech Stack
- Backend: Laravel 12
- Frontend: React + Inertia.js + TypeScript
- Styling: Tailwind CSS v4 + shadcn/ui
- Routing: Ziggy
- Permissions: Spatie laravel-permission
- Local Dev: XAMPP + Git Bash (Windows 10)

## Module List (v1.0)
00. Project Standards
01. Project Foundation
02. Authentication & Permission
03. Business Settings
04. Notification System
05. Product Module
06. Inventory
07. Customer
08. POS (Cart/Sale)
09. Invoice
10. Orders
11. Expense
12. Investment
13. Profit Distribution
14. Dashboard
15. Reports
16. Security Hardening
17. Performance Optimization
18. Testing

## Module Communication Pattern
- Controllers stay thin — business logic lives in Service classes
  (app/Services/{Module}Service.php)
- Cross-module side effects (e.g. POS sale → reduce stock) handled via
  Laravel Events & Listeners, not direct cross-calls
- Example: OrderCreated event → ReduceStockListener, LowStockNotificationListener

## Future Scalability Notes
- Admin routes live under `backend.*` — Customer Portal will get its own
  `Api/` controller layer reusing the same Models/Services
- Inventory tables include `warehouse_id` from day one (multi-warehouse ready)
- Tenant/business_id column can be retrofitted later for SaaS if tables
  stay normalized
