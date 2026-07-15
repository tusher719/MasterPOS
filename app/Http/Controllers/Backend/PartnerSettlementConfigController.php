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

        // Only one active config per partner allowed
        if ($partner->settlementConfigs()->active()->exists()) {
            return back()->with('error', 'An active settlement config already exists for this partner. Edit or delete it first.');
        }

        $validated = $request->validate([
            'settlement_type'    => ['required', 'in:profit_only,cost_plus_profit,custom'],
            'payment_preference' => ['required', 'in:cash,bank_transfer,adjustment,reinvestment'],
            'auto_cost_return'   => ['boolean'],
            'notes'              => ['nullable', 'string', 'max:1000'],
            'is_active'          => ['boolean'],
        ]);

        $config = $partner->settlementConfigs()->create([
            ...$validated,
            'auto_cost_return' => $request->boolean('auto_cost_return'),
            'is_active'        => true,
            'created_by'       => Auth::id(),
        ]);

        ActivityLogService::log(
            'partners',
            'settlement_config_created',
            "Settlement config created for partner [{$partner->name}]: {$config->settlement_type} / {$config->payment_preference}",
            $config,
            ['partner_id' => $partner->id, 'settlement_type' => $config->settlement_type]
        );

        return back()->with('success', 'Settlement config created successfully.');
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(Request $request, Partner $partner, PartnerSettlementConfig $config): RedirectResponse
    {
        abort_unless(Gate::allows('edit', PartnerSettlementConfig::class), 403);
        abort_unless($config->partner_id === $partner->id, 404);

        $validated = $request->validate([
            'settlement_type'    => ['required', 'in:profit_only,cost_plus_profit,custom'],
            'payment_preference' => ['required', 'in:cash,bank_transfer,adjustment,reinvestment'],
            'auto_cost_return'   => ['boolean'],
            'notes'              => ['nullable', 'string', 'max:1000'],
        ]);

        $old = [
            'settlement_type'    => $config->settlement_type,
            'payment_preference' => $config->payment_preference,
            'auto_cost_return'   => $config->auto_cost_return,
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

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function destroy(Partner $partner, PartnerSettlementConfig $config): RedirectResponse
    {
        abort_unless(Gate::allows('delete', PartnerSettlementConfig::class), 403);
        abort_unless($config->partner_id === $partner->id, 404);

        ActivityLogService::log(
            'partners',
            'settlement_config_deleted',
            "Settlement config deleted for partner [{$partner->name}]: {$config->settlement_type} / {$config->payment_preference}",
            $config,
            ['partner_id' => $partner->id, 'settlement_type' => $config->settlement_type]
        );

        $config->delete();

        return back()->with('success', 'Settlement config deleted successfully.');
    }
}
