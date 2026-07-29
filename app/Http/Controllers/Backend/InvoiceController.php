<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\BusinessSetting;
use App\Models\Sale;
use App\Services\SettingsService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($this->userHasPermission('invoice.view'), 403);

        $query = Sale::with([
            'customer:id,name,email,phone,address,city',
            'paymentMethod:id,name',
            'creator:id,name',
        ])
            ->withTrashed()
            ->latest('sale_date');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn($q2) => $q2->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }

        $invoices = $query->paginate(20)->withQueryString();

        $stats = [
            'total'   => Sale::withTrashed()->count(),
            'paid'    => Sale::withTrashed()->where('payment_status', 'paid')->count(),
            'partial' => Sale::withTrashed()->where('payment_status', 'partial')->count(),
            'due'     => Sale::withTrashed()->where('payment_status', 'due')->count(),
        ];

        $can = [
            'view'  => $this->userHasPermission('invoice.view'),
            'print' => $this->userHasPermission('invoice.print'),
        ];

        return Inertia::render('Backend/Invoices/Index', [
            'invoices' => $invoices,
            'stats'    => $stats,
            'filters'  => $request->only(['search', 'payment_status', 'date_from', 'date_to']),
            'can'      => $can,
        ]);
    }

    public function show(Sale $sale)
    {
        abort_unless($this->userHasPermission('invoice.view'), 403);

        $sale->load([
            'customer:id,name,email,phone,address,city,country',
            'paymentMethod:id,name',
            'creator:id,name',
            'items.product:id,name,sku',
        ]);

        $can = [
            'print' => $this->userHasPermission('invoice.print'),
        ];

        return Inertia::render('Backend/Invoices/Show', [
            'sale'     => $sale,
            'business' => $this->resolveBusinessProfile(),
            'can'      => $can,
        ]);
    }

    public function pdf(Sale $sale)
    {
        abort_unless($this->userHasPermission('invoice.view'), 403);
        abort_unless($this->userHasPermission('invoice.print'), 403);

        $sale->load([
            'customer:id,name,email,phone,address,city,country',
            'paymentMethod:id,name',
            'creator:id,name',
            'items.product:id,name,sku',
        ]);

        $pdf = Pdf::loadView('pdf.invoice', [
            'sale'     => $sale,
            'business' => $this->resolveBusinessProfile(),
            'settings' => SettingsService::all(),
        ])->setPaper('a4', 'portrait');

        $filename = 'Invoice-' . $sale->reference_no . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Build a flat business profile array from the key-value
     * business_settings store (groups: business, currency).
     */
    private function resolveBusinessProfile(): array
    {
        $all = SettingsService::all(); // cache-backed

        $logoPath = $all['business_logo'] ?? null;

        return [
            'business_name'     => $all['business_name']     ?? config('app.name'),
            'email'             => $all['business_email']    ?? null,
            'phone'             => $all['business_phone']    ?? null,
            'address'           => $all['business_address']  ?? null,
            'logo'              => $logoPath,
            'currency_symbol'   => $all['currency_symbol']   ?? '৳',
            'currency_position' => $all['currency_position'] ?? 'before',
            'decimal_places'    => (int) ($all['decimal_places'] ?? 2),
        ];

        $logoPath = $business['business_logo'] ?? null;

        return [
            'business_name'     => $business['business_name'] ?? config('app.name'),
            'email'             => $business['business_email'] ?? null,
            'phone'             => $business['business_phone'] ?? null,
            'address'           => $business['business_address'] ?? null,
            'logo'              => $logoPath,
            'currency_symbol'   => $currency['currency_symbol'] ?? '৳',
            'currency_position' => $currency['currency_position'] ?? 'before',
            'decimal_places'    => (int) ($currency['decimal_places'] ?? 2),
        ];
    }

    /**
     * Check if current authenticated user has a given permission.
     * Falls back to calling ->can() if hasPermissionTo() is not available.
     */
    private function userHasPermission(string $permission): bool
    {
        $user = Auth::user();
        if (! $user) {
            return false;
        }

        if (method_exists($user, 'hasPermissionTo')) {
            try {
                return (bool) $user->hasPermissionTo($permission);
            } catch (\Throwable $e) {
                return false;
            }
        }

        if (method_exists($user, 'can')) {
            try {
                return (bool) $user->can($permission);
            } catch (\Throwable $e) {
                return false;
            }
        }

        return false;
    }
}
