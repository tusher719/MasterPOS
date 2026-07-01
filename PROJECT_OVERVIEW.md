# PROJECT_STATUS.md

Project: Master POS System
Document Version: v1.0
Last Updated Step: Step 02 — Authentication & Permission
Last Updated Date: 2026-06-30

## Completed Modules

- Step 00: Project Standards (Approved)
- Step 01: Project Foundation
- Step 02: Authentication & Permission

## Pending Modules

- Step 03: Business Settings
- Step 04: Notification System
- Step 05: Product Module
- Step 06: Inventory
- Step 07: Customer
- Step 08: POS (Cart/Sale)
- Step 09: Invoice
- Step 10: Orders
- Step 11: Expense
- Step 12: Investment
- Step 13: Profit Distribution
- Step 14: Dashboard
- Step 15: Reports
- Step 16: Security Hardening
- Step 17: Performance Optimization
- Step 18: Testing

## Current Database Tables

- users → admin/staff accounts (phone, status, avatar, soft deletes)
- login_histories → login tracking per user
- activity_logs → audit trail (module, action, subject)
- roles → Spatie roles
- permissions → Spatie permissions
- model_has_roles → pivot
- model_has_permissions → pivot
- role_has_permissions → pivot

## Current Relationships

- User hasMany LoginHistory
- User hasMany ActivityLog
- User hasRoles (Spatie)

## Routes Registered

- backend.users.index / store / update / destroy
- backend.roles.index / store / permissions / destroy
- backend.login-histories.index
- backend.activity-logs.index

## Permissions Registered

- users.view, users.create, users.edit, users.delete,
  users.archive, users.restore
- roles.view, roles.create, roles.edit, roles.delete

## Notifications Implemented

- None yet (Step 04)

## Seeders

- RolePermissionSeeder → Admin role (all permissions), Staff role (empty)
- Default admin: admin@masterpos.test / password

## Tech Stack

- Backend: Laravel 12
- Frontend: React + Inertia.js + TypeScript
- Styling: Tailwind CSS v4 + shadcn/ui
- Routing: Ziggy
- Permissions: Spatie laravel-permission
- Toast: sonner
- Confirm dialog: SweetAlert2
- Local Dev: XAMPP + Git Bash (Windows 10)

## Shared Components / Libs

- Components/shared/DataTable.tsx
- Components/shared/Modal.tsx
- hooks/useFlashToast.ts
- lib/confirm.ts (SweetAlert2 wrapper)
- Services/ActivityLogService.php

## Coding Standards (Step 00 — never change)

- Modals for create/edit (no separate pages)
- sonner for toast notifications
- SweetAlert2 for confirm dialogs
- English-only code comments
- Short git commit messages
- Permission format: module.action
- Route format: backend.{module}.{action}
- Money fields: decimal(10,2)
- Status fields: Enum class

## Known Issues

- None

## Next Step

Step 03 — Business Settings
