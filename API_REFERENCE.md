# MasterPOS — API & Route Reference

**Project:** Master Business Suite (MasterPOS)  
**Version:** v2.0  
**Framework:** Laravel 12 + Inertia.js + React 18 + TypeScript  
**Authentication:** Laravel Breeze (Session-based) + Spatie Laravel-Permission  

---

## 1. Surfaces & Route Overview

| Surface | URL Prefix | Middleware Stack | Guard / Access |
|---|---|---|---|
| **Public Storefront** | `/` | `web` | Guest / Public |
| **Authentication** | `/login`, `/register`, etc. | `web`, `guest` | Unauthenticated |
| **Backend Admin** | `/backend` | `web`, `auth`, `verified` | Staff / Admin with Spatie Permissions |
| **POS Terminal** | `/backend/pos` | `web`, `auth`, `verified` | POS Users with `pos.view` |

---

## 2. Authentication & Profile Routes

| Method | URI | Name | Description |
|---|---|---|---|
| `GET` | `/login` | `login` | Render login page |
| `POST` | `/login` | `login` | Authenticate user session |
| `POST` | `/logout` | `logout` | Terminate session |
| `GET` | `/register` | `register` | Render registration page |
| `POST` | `/register` | `register` | Register new user account |
| `GET` | `/forgot-password` | `password.request` | Request password reset link |
| `POST` | `/forgot-password` | `password.email` | Send password reset notification |
| `GET` | `/reset-password/{token}` | `password.reset` | Password reset form |
| `POST` | `/reset-password` | `password.store` | Update user password |
| `GET` | `/verify-email` | `verification.notice` | Email verification prompt |
| `GET` | `/verify-email/{id}/{hash}`| `verification.verify` | Confirm email verification |
| `GET` | `/profile` | `profile.edit` | Render user profile page |
| `PATCH` | `/profile` | `profile.update` | Update user profile info |
| `DELETE` | `/profile` | `profile.destroy` | Delete account (soft delete) |
| `PUT` | `/password` | `password.update` | Update current user password |

---

## 3. Core Administration & User Management

Prefix: `/backend`  
Middleware: `['auth', 'verified']`

| Method | URI | Name | Permission | Description |
|---|---|---|---|---|
| `GET` | `/backend/dashboard` | `backend.dashboard` | — | Admin summary dashboard |
| `GET` | `/backend/users` | `backend.users.index` | `users.view` | User list + search + pagination |
| `POST` | `/backend/users` | `backend.users.store` | `users.create` | Create new user with roles |
| `PUT` | `/backend/users/{user}` | `backend.users.update` | `users.edit` | Update user profile and roles |
| `DELETE`| `/backend/users/{user}` | `backend.users.destroy` | `users.delete` | Soft delete user |
| `GET` | `/backend/roles` | `backend.roles.index` | `roles.view` | Role list and permissions |
| `POST` | `/backend/roles` | `backend.roles.store` | `roles.create` | Create new role |
| `PUT` | `/backend/roles/{role}/permissions` | `backend.roles.permissions` | `roles.edit` | Sync permissions to role |
| `DELETE`| `/backend/roles/{role}` | `backend.roles.destroy` | `roles.delete` | Delete custom role |
| `GET` | `/backend/login-histories` | `backend.login-histories.index` | `users.view` | User login audit history |
| `GET` | `/backend/activity-logs` | `backend.activity-logs.index` | `users.view` | System-wide activity logs |

---

## 4. Business Settings & Configurations

| Method | URI | Name | Permission | Description |
|---|---|---|---|---|
| `GET` | `/backend/settings` | `backend.settings.index` | `settings.view` | Business settings overview |
| `POST` | `/backend/settings` | `backend.settings.update` | `settings.edit` | Update business settings |
| `POST` | `/backend/settings/logo` | `backend.settings.logo` | `settings.edit` | Upload business/navbar logo |
| `GET` | `/backend/payment-methods` | `backend.payment-methods.index` | `settings.view` | Payment methods list |
| `POST` | `/backend/payment-methods` | `backend.payment-methods.store` | `settings.edit` | Create payment method |
| `PUT` | `/backend/payment-methods/{paymentMethod}` | `backend.payment-methods.update` | `settings.edit` | Update payment method |
| `DELETE`| `/backend/payment-methods/{paymentMethod}` | `backend.payment-methods.destroy` | `settings.edit` | Delete payment method |
| `GET` | `/backend/expense-categories` | `backend.expense-categories.index`| `settings.view` | Expense categories list |
| `POST` | `/backend/expense-categories` | `backend.expense-categories.store`| `settings.edit` | Create expense category |
| `PUT` | `/backend/expense-categories/{expenseCategory}` | `backend.expense-categories.update`| `settings.edit` | Update expense category |
| `DELETE`| `/backend/expense-categories/{expenseCategory}` | `backend.expense-categories.destroy`| `settings.edit` | Delete expense category |
| `GET` | `/backend/investment-types` | `backend.investment-types.index`| `settings.view` | Investment types list |
| `POST` | `/backend/investment-types` | `backend.investment-types.store`| `settings.edit` | Create investment type |
| `PUT` | `/backend/investment-types/{investmentType}` | `backend.investment-types.update`| `settings.edit` | Update investment type |
| `DELETE`| `/backend/investment-types/{investmentType}` | `backend.investment-types.destroy`| `settings.edit` | Delete investment type |

---

## 5. Catalogue & Inventory (Products, Categories, Units)

| Method | URI | Name | Permission | Description |
|---|---|---|---|---|
| `GET` | `/backend/products` | `backend.products.index` | `products.view` | Product catalog with filters |
| `GET` | `/backend/products/create` | `backend.products.create` | `products.create`| Render create product form |
| `POST` | `/backend/products` | `backend.products.store` | `products.create`| Store product, variants, images |
| `GET` | `/backend/products/{product}` | `backend.products.show` | `products.view` | Product details and stock |
| `GET` | `/backend/products/{product}/edit` | `backend.products.edit` | `products.edit` | Render edit product form |
| `PUT` | `/backend/products/{product}` | `backend.products.update` | `products.edit` | Update product, variants, images |
| `DELETE`| `/backend/products/{product}` | `backend.products.destroy` | `products.delete`| Soft delete product |
| `POST` | `/backend/products/{id}/restore` | `backend.products.restore` | `products.restore`| Restore soft-deleted product |
| `GET` | `/backend/product-categories` | `backend.product-categories.index`| `categories.view` | Categories list |
| `POST` | `/backend/product-categories` | `backend.product-categories.store`| `categories.create` | Store category |
| `PUT` | `/backend/product-categories/{category}` | `backend.product-categories.update`| `categories.edit` | Update category |
| `DELETE`| `/backend/product-categories/{category}` | `backend.product-categories.destroy`| `categories.delete`| Delete category |
| `GET` | `/backend/units` | `backend.units.index` | `units.view` | Unit measurement list |
| `POST` | `/backend/units` | `backend.units.store` | `units.create` | Create unit |
| `PUT` | `/backend/units/{unit}` | `backend.units.update` | `units.edit` | Update unit |
| `DELETE`| `/backend/units/{unit}` | `backend.units.destroy` | `units.delete` | Delete unit |

---

## 6. Purchases & Suppliers

| Method | URI | Name | Permission | Description |
|---|---|---|---|---|
| `GET` | `/backend/purchases` | `backend.purchases.index` | `purchases.view` | Purchases order list |
| `GET` | `/backend/purchases/create` | `backend.purchases.create` | `purchases.create`| Create purchase page |
| `POST` | `/backend/purchases` | `backend.purchases.store` | `purchases.create`| Store purchase order & stock |
| `GET` | `/backend/purchases/{purchase}` | `backend.purchases.show` | `purchases.view` | Purchase order details |
| `GET` | `/backend/purchases/{purchase}/edit` | `backend.purchases.edit` | `purchases.edit` | Edit purchase order |
| `PUT` | `/backend/purchases/{purchase}` | `backend.purchases.update` | `purchases.edit` | Update purchase order |
| `DELETE`| `/backend/purchases/{purchase}` | `backend.purchases.destroy` | `purchases.delete`| Soft delete purchase |
| `POST` | `/backend/purchases/{purchase}/duplicate`| `backend.purchases.duplicate` | `purchases.create`| Clone existing purchase order |
| `GET` | `/backend/purchases/{purchase}/payments`| `backend.purchases.payments.index`| `purchases.view` | Payments for purchase |
| `POST` | `/backend/purchases/{purchase}/payments`| `backend.purchases.payments.store`| `purchases.edit` | Record purchase payment |
| `DELETE`| `/backend/purchases/{purchase}/payments/{payment}`| `backend.purchases.payments.destroy`| `purchases.delete`| Void purchase payment |
| `GET` | `/backend/suppliers` | `backend.suppliers.index` | `suppliers.view` | Supplier directory |
| `POST` | `/backend/suppliers` | `backend.suppliers.store` | `suppliers.create`| Register supplier |
| `PUT` | `/backend/suppliers/{supplier}` | `backend.suppliers.update` | `suppliers.edit` | Update supplier info |
| `DELETE`| `/backend/suppliers/{supplier}` | `backend.suppliers.destroy`| `suppliers.delete`| Delete supplier |
| `GET` | `/backend/purchase-returns` | `backend.purchase-returns.index` | `purchases.view` | Purchase returns list |
| `POST` | `/backend/purchase-returns` | `backend.purchase-returns.store` | `purchases.create`| Record purchase return |
| `POST` | `/backend/purchase-returns/{return}/confirm` | `backend.purchase-returns.confirm` | `purchases.edit` | Confirm return & deduct stock |

---

## 7. POS, Sales, Hold Orders & Invoicing

| Method | URI | Name | Permission | Description |
|---|---|---|---|---|
| `GET` | `/backend/pos` | `backend.pos.index` | `pos.view` | Main POS terminal interface |
| `GET` | `/backend/sales` | `backend.sales.index` | `sales.view` | Sales history & filter list |
| `POST` | `/backend/sales` | `backend.sales.store` | `sales.create` | Create sale / checkout (Returns JSON) |
| `GET` | `/backend/sales/{sale}` | `backend.sales.show` | `sales.view` | Sale receipt & line items |
| `DELETE`| `/backend/sales/{sale}` | `backend.sales.destroy` | `sales.delete` | Void/delete sale |
| `GET` | `/backend/sales/{sale}/invoice` | `backend.sales.invoice` | `sales.view` | Render HTML invoice |
| `GET` | `/backend/sales/{sale}/invoice/pdf` | `backend.sales.invoice.pdf` | `sales.view` | Download DomPDF invoice |
| `GET` | `/backend/sales/{sale}/invoice/pos-print`| `backend.sales.invoice.pos-print`| `sales.view` | Thermal 80mm/58mm slip |
| `GET` | `/backend/hold-orders` | `backend.hold-orders.index` | `pos.view` | Active held orders list |
| `POST` | `/backend/hold-orders` | `backend.hold-orders.store` | `pos.view` | Hold current cart |
| `POST` | `/backend/hold-orders/{holdOrder}/resume`| `backend.hold-orders.resume` | `pos.view` | Resume held order to cart |
| `POST` | `/backend/hold-orders/{holdOrder}/release`| `backend.hold-orders.release`| `pos.view` | Release order back to hold |
| `DELETE`| `/backend/hold-orders/{holdOrder}`| `backend.hold-orders.destroy`| `pos.view` | Hard delete held order |
| `GET` | `/backend/customers` | `backend.customers.index` | `customers.view` | Customer registry |
| `POST` | `/backend/customers` | `backend.customers.store` | `customers.create` | Create customer |
| `PUT` | `/backend/customers/{customer}` | `backend.customers.update` | `customers.edit` | Update customer details |
| `DELETE`| `/backend/customers/{customer}` | `backend.customers.destroy` | `customers.delete` | Soft delete customer |

---

## 8. Finance, Partners, Investments & Profit Distribution

| Method | URI | Name | Permission | Description |
|---|---|---|---|---|
| `GET` | `/backend/expenses` | `backend.expenses.index` | `expenses.view` | Expense record tracker |
| `POST` | `/backend/expenses` | `backend.expenses.store` | `expenses.create` | Record new business expense |
| `PUT` | `/backend/expenses/{expense}` | `backend.expenses.update` | `expenses.edit` | Update expense record |
| `DELETE`| `/backend/expenses/{expense}` | `backend.expenses.destroy` | `expenses.delete` | Delete expense |
| `GET` | `/backend/investments` | `backend.investments.index` | `investments.view`| Capital investments |
| `POST` | `/backend/investments` | `backend.investments.store` | `investments.create`| Add capital investment |
| `GET` | `/backend/partners` | `backend.partners.index` | `partners.view` | Partner directory & shares |
| `POST` | `/backend/partners` | `backend.partners.store` | `partners.create` | Add new business partner |
| `PUT` | `/backend/partners/{partner}` | `backend.partners.update` | `partners.edit` | Update partner config |
| `GET` | `/backend/profit-distributions` | `backend.profit-distributions.index` | `profit_distributions.view` | Distributions history |
| `GET` | `/backend/profit-distributions/create`| `backend.profit-distributions.create`| `profit_distributions.create`| Multi-step calculation wizard |
| `POST` | `/backend/profit-distributions`| `backend.profit-distributions.store` | `profit_distributions.create`| Save profit distribution |
| `GET` | `/backend/capital-ledger` | `backend.capital-ledger.index` | `capital_ledger.view`| Capital ledger statement |

---

## 9. Reports & Exports

Prefix: `/backend/reports`  
Permission: `reports.view`

| Method | URI | Name | Description |
|---|---|---|---|
| `GET` | `/backend/reports` | `backend.reports.index` | Reports dashboard |
| `GET` | `/backend/reports/sales` | `backend.reports.sales` | Sales & revenue report |
| `GET` | `/backend/reports/purchases` | `backend.reports.purchases` | Purchases & COGS report |
| `GET` | `/backend/reports/inventory` | `backend.reports.inventory` | Stock valuation & reorder report |
| `GET` | `/backend/reports/expenses` | `backend.reports.expenses` | Categorized expense breakdown |
| `GET` | `/backend/reports/profit-loss` | `backend.reports.profit-loss` | Gross & net profit calculation |
| `GET` | `/backend/reports/customer-ledger` | `backend.reports.customer-ledger` | Customer balance & transaction history |
| `GET` | `/backend/reports/{type}/export/{fmt}`| `backend.reports.export` | Export report to Excel (`xlsx`) or PDF (`pdf`) |

---

## 10. Public Storefront (Sprint 8)

| Method | URI | Description |
|---|---|---|
| `GET` | `/` | Public Home & Featured Products |
| `GET` | `/catalog` | Public Product Catalog with search, categories, and filters |
| `GET` | `/search` | Live AJAX search dropdown & search results page |
| `GET` | `/products/{slug}` | Public single product details |
| `GET` | `/cart` | Public shopping cart (localStorage persisted) |
| `GET` | `/checkout` | Public guest checkout page |
| `POST`| `/checkout` | Place public guest online order |
| `GET` | `/order-confirmation/{order}` | Public order tracking confirmation |
