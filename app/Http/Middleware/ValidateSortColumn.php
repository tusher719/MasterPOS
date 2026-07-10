<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateSortColumn
{
    // Allowlists per module — only these columns can be passed as ?sort_by=
    private array $allowlists = [
        'users'                  => ['name', 'email', 'created_at'],
        'suppliers'              => ['name', 'company', 'email', 'created_at'],
        'customers'              => ['name', 'email', 'phone', 'created_at'],
        'products'               => ['name', 'sale_price', 'stock_qty', 'created_at'],
        'purchases'              => ['reference_no', 'purchase_date', 'grand_total', 'payment_status', 'created_at'],
        'sales'                  => ['reference_no', 'sale_date', 'grand_total', 'payment_status', 'created_at'],
        'expenses'               => ['title', 'amount', 'expense_date', 'created_at'],
        'investments'            => ['title', 'investor_name', 'amount', 'investment_date', 'status', 'created_at'],
        'profit-distributions'   => ['distribution_no', 'distribution_date', 'net_profit', 'status', 'created_at'],
        'reports'                => ['created_at', 'sale_date', 'purchase_date', 'expense_date', 'investment_date'],
    ];

    private array $allowedDirections = ['asc', 'desc'];

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->has('sort_by')) {
            $segment  = $request->segment(2); // e.g. 'users', 'products'
            $allowed  = $this->allowlists[$segment] ?? [];
            $sortBy   = $request->input('sort_by');

            if (!in_array($sortBy, $allowed, true)) {
                $request->query->remove('sort_by');
            }
        }

        if ($request->has('sort_order')) {
            $order = strtolower($request->input('sort_order'));
            if (!in_array($order, $this->allowedDirections, true)) {
                $request->query->remove('sort_order');
            }
        }

        // Also sanitize 'order' param (used in some controllers)
        if ($request->has('order')) {
            $order = strtolower($request->input('order'));
            if (!in_array($order, $this->allowedDirections, true)) {
                $request->query->remove('order');
            }
        }

        return $next($request);
    }
}
