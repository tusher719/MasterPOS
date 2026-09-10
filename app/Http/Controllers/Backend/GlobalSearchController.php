<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Investment;
use App\Models\Partner;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class GlobalSearchController extends Controller
{
    private const PER_CATEGORY = 5;
    private const MIN_LENGTH   = 2;

    public function search(Request $request): JsonResponse
    {
        $q = trim($request->string('q'));

        if (mb_strlen($q) < self::MIN_LENGTH) {
            return response()->json(['results' => []]);
        }

        $results = [];

        if (Gate::allows('product.view')) {
            $results['products'] = $this->searchProducts($q);
        }
        if (Gate::allows('customer.view')) {
            $results['customers'] = $this->searchCustomers($q);
        }
        if (Gate::allows('supplier.view')) {
            $results['suppliers'] = $this->searchSuppliers($q);
        }
        if (Gate::allows('sale.view')) {
            $results['sales'] = $this->searchSales($q);
        }
        if (Gate::allows('investment.view')) {
            $results['investments'] = $this->searchInvestments($q);
        }
        if (Gate::allows('partners.view')) {
            $results['partners'] = $this->searchPartners($q);
        }

        return response()->json(['results' => $results]);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Generate 1-2 character initials from a name string.
     * "John Doe" → "JD", "Alice" → "A"
     */
    private function initials(string $name): string
    {
        $words = preg_split('/\s+/', trim($name));
        if (count($words) >= 2) {
            return strtoupper(mb_substr($words[0], 0, 1) . mb_substr($words[1], 0, 1));
        }
        return strtoupper(mb_substr($name, 0, 2));
    }

    /**
     * Resolve a product image URL from its primaryImage relation.
     * Returns null when no image is configured.
     */
    private function productImageUrl(?object $primaryImage): ?string
    {
        if (! $primaryImage?->image_path) {
            return null;
        }

        return request()->getSchemeAndHttpHost()
            . request()->getBaseUrl()
            . '/storage/' . $primaryImage->image_path;
    }

    // ─── Module search methods ──────────────────────────────────────────────────

    private function searchProducts(string $q): array
    {
        return Product::with('primaryImage')
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                      ->orWhere('sku',  'like', "%{$q}%")
                      ->orWhere('barcode', 'like', "%{$q}%");
            })
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->limit(self::PER_CATEGORY)
            ->get(['id', 'name', 'sku', 'sale_price', 'stock_qty'])
            ->map(fn ($p) => [
                'id'       => $p->id,
                'title'    => $p->name,
                'subtitle' => "SKU: {$p->sku} · Stock: {$p->stock_qty}",
                'url'      => route('backend.products.edit', $p->id),
                'type'     => 'product',
                'image'    => $this->productImageUrl($p->primaryImage),
                'initials' => $this->initials($p->name),
            ])
            ->values()
            ->all();
    }

    private function searchCustomers(string $q): array
    {
        return Customer::query()
            ->where(function ($query) use ($q) {
                $query->where('name',  'like', "%{$q}%")
                      ->orWhere('phone', 'like', "%{$q}%")
                      ->orWhere('email', 'like', "%{$q}%");
            })
            ->whereNull('deleted_at')
            ->limit(self::PER_CATEGORY)
            ->get(['id', 'name', 'phone', 'email'])
            ->map(fn ($c) => [
                'id'       => $c->id,
                'title'    => $c->name,
                'subtitle' => $c->phone ?? $c->email ?? 'No contact info',
                'url'      => route('backend.customers.index', ['search' => $c->name]),
                'type'     => 'customer',
                'image'    => null,
                'initials' => $this->initials($c->name),
            ])
            ->values()
            ->all();
    }

    private function searchSuppliers(string $q): array
    {
        return Supplier::query()
            ->where(function ($query) use ($q) {
                $query->where('name',    'like', "%{$q}%")
                      ->orWhere('phone',   'like', "%{$q}%")
                      ->orWhere('company', 'like', "%{$q}%");
            })
            ->whereNull('deleted_at')
            ->limit(self::PER_CATEGORY)
            ->get(['id', 'name', 'company', 'phone'])
            ->map(fn ($s) => [
                'id'       => $s->id,
                'title'    => $s->name,
                'subtitle' => $s->company ?? $s->phone ?? 'No contact info',
                'url'      => route('backend.suppliers.index', ['search' => $s->name]),
                'type'     => 'supplier',
                'image'    => null,
                'initials' => $this->initials($s->name),
            ])
            ->values()
            ->all();
    }

    private function searchSales(string $q): array
    {
        return Sale::query()
            ->where('reference_no', 'like', "%{$q}%")
            ->whereNull('deleted_at')
            ->limit(self::PER_CATEGORY)
            ->get(['id', 'reference_no', 'grand_total', 'payment_status', 'sale_date'])
            ->map(fn ($s) => [
                'id'       => $s->id,
                'title'    => $s->reference_no,
                'subtitle' => '৳' . number_format($s->grand_total, 2) . ' · ' . $s->payment_status,
                'url'      => route('backend.pos.sales.show', $s->id),
                'type'     => 'sale',
                'image'    => null,
                'initials' => null, // Sales show reference badge instead
            ])
            ->values()
            ->all();
    }

    private function searchInvestments(string $q): array
    {
        return Investment::query()
            ->where(function ($query) use ($q) {
                $query->where('title',         'like', "%{$q}%")
                      ->orWhere('investor_name', 'like', "%{$q}%")
                      ->orWhere('reference',     'like', "%{$q}%");
            })
            ->whereNull('deleted_at')
            ->limit(self::PER_CATEGORY)
            ->get(['id', 'title', 'investor_name', 'amount', 'status'])
            ->map(fn ($i) => [
                'id'       => $i->id,
                'title'    => $i->title,
                'subtitle' => $i->investor_name . ' · ৳' . number_format($i->amount, 2),
                'url'      => route('backend.investments.show', $i->id),
                'type'     => 'investment',
                'image'    => null,
                'initials' => $this->initials($i->investor_name),
            ])
            ->values()
            ->all();
    }

    private function searchPartners(string $q): array
    {
        return Partner::query()
            ->where(function ($query) use ($q) {
                $query->where('name',  'like', "%{$q}%")
                        ->orWhere('code',  'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%");
            })
            ->whereNull('deleted_at')
            ->limit(self::PER_CATEGORY)
            ->get(['id', 'name', 'code', 'phone'])
            ->map(fn ($p) => [
                'id'       => $p->id,
                'title'    => $p->name,
                'subtitle' => $p->code . ($p->phone ? " · {$p->phone}" : ''),
                'url'      => route('backend.partners.show', $p->id),
                'type'     => 'partner',
                'image'    => null,
                'initials' => $this->initials($p->name),
            ])
            ->values()
            ->all();
    }
}
