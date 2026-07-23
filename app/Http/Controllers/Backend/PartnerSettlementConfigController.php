<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\PartnerSettlementConfig;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class PartnerSettlementConfigController extends Controller
{
    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(Request $request, Partner $partner): RedirectResponse
    {
        abort_unless(Gate::allows('create', PartnerSettlementConfig::class), 403);

        $validated = $request->validate([
            'settlement_type'    => ['required', 'in:profit_only,cost_plus_profit,custom'],
            'payment_preference' => ['required', 'in:cash,bank_transfer,adjustment,reinvestment'],
            'auto_cost_return'   => ['boolean'],
            'notes'              => ['nullable', 'string', 'max:1000'],
            'applies_to'         => ['required', 'in:capital,working,product,all'],
            'is_active'          => ['boolean'],
        ]);

        // One active config per partner per applies_to value allowed (Gap 2.3)
        $duplicate = $partner->settlementConfigs()
            ->active()
            ->where('applies_to', $validated['applies_to'])
            ->exists();

        if ($duplicate) {
            $label = match ($validated['applies_to']) {
                'capital' => 'Capital Stream',
                'working' => 'Working Stream',
                'product' => 'Product Stream',
                default   => 'All Streams',
            };
            return back()->with('error', "An active settlement config for [{$label}] already exists. Edit or delete it first.");
        }

        $config = $partner->settlementConfigs()->create([
            ...$validated,
            'auto_cost_return' => $request->boolean('auto_cost_return'),
            'is_active'        => true,
            'created_by'       => Auth::id(),
            // approved_by / approved_at intentionally omitted — pending until approved
        ]);

        ActivityLogService::log(
            'partners',
            'settlement_config_created',
            "Settlement config created for partner [{$partner->name}]: {$config->settlement_type} / {$config->payment_preference} / {$config->applies_to}",
            $config,
            [
                'partner_id'      => $partner->id,
                'settlement_type' => $config->settlement_type,
                'applies_to'      => $config->applies_to,
            ]
        );

        return back()->with('success', 'Settlement config created successfully. Pending Super Admin approval.');
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(Request $request, Partner $partner, PartnerSettlementConfig $config): RedirectResponse
    {
        abort_unless(Gate::allows('edit', PartnerSettlementConfig::class), 403);
        abort_unless($config->partner_id === $partner->id, 404);

        // Block editing approved configs — same pattern as partner_profit_rules
        if ($config->is_approved) {
            return back()->with('error', 'Approved settlement configs cannot be edited. Delete and create a new one.');
        }

        $validated = $request->validate([
            'settlement_type'    => ['required', 'in:profit_only,cost_plus_profit,custom'],
            'payment_preference' => ['required', 'in:cash,bank_transfer,adjustment,reinvestment'],
            'auto_cost_return'   => ['boolean'],
            'notes'              => ['nullable', 'string', 'max:1000'],
            'applies_to'         => ['required', 'in:capital,working,product,all'],
        ]);

        $old = [
            'settlement_type'    => $config->settlement_type,
            'payment_preference' => $config->payment_preference,
            'auto_cost_return'   => $config->auto_cost_return,
            'applies_to'         => $config->applies_to,
        ];

        $config->update([
            ...$validated,
            'auto_cost_return' => $request->boolean('auto_cost_return'),
        ]);

        ActivityLogService::log(
            'partners',
            'settlement_config_updated',
            "Settlement config updated for partner [{$partner->name}]",
            $config,
            ['partner_id' => $partner->id, 'old' => $old, 'new' => $validated]
        );

        return back()->with('success', 'Settlement config updated successfully.');
    }

    // ─── Approve ──────────────────────────────────────────────────────────────

    public function approve(Partner $partner, PartnerSettlementConfig $config): RedirectResponse
    {
        abort_unless(Gate::allows('approve', PartnerSettlementConfig::class), 403);
        abort_unless($config->partner_id === $partner->id, 404);

        if ($config->is_approved) {
            return back()->with('error', 'This settlement config is already approved.');
        }

        $config->approve();

        ActivityLogService::log(
            'partners',
            'settlement_config_approved',
            "Settlement config approved for partner [{$partner->name}]: {$config->settlement_type} / {$config->payment_preference} / {$config->applies_to}",
            $config,
            [
                'partner_id'      => $partner->id,
                'settlement_type' => $config->settlement_type,
                'applies_to'      => $config->applies_to,
                'approved_by'     => Auth::id(),
            ]
        );

        return back()->with('success', 'Settlement config approved successfully.');
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function destroy(Partner $partner, PartnerSettlementConfig $config): RedirectResponse
    {
        abort_unless(Gate::allows('delete', PartnerSettlementConfig::class), 403);
        abort_unless($config->partner_id === $partner->id, 404);

        // Block deleting approved configs
        if ($config->is_approved) {
            return back()->with('error', 'Approved settlement configs cannot be deleted.');
        }

        ActivityLogService::log(
            'partners',
            'settlement_config_deleted',
            "Settlement config deleted for partner [{$partner->name}]: {$config->settlement_type} / {$config->payment_preference} / {$config->applies_to}",
            $config,
            [
                'partner_id'      => $partner->id,
                'settlement_type' => $config->settlement_type,
                'applies_to'      => $config->applies_to,
            ]
        );

        $config->delete();

        return back()->with('success', 'Settlement config deleted successfully.');
    }
}
