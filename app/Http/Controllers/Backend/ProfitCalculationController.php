<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Services\ProfitCalculation\ProfitCalculationEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProfitCalculationController extends Controller
{
    public function __construct(
        private ProfitCalculationEngine $engine
    ) {}

    /**
     * Calculate profit preview for a distribution period.
     * Called via AJAX from Create.tsx before form submission.
     * Returns JSON — not an Inertia response.
     */
    public function preview(Request $request): JsonResponse
    {
        abort_unless(
            Gate::allows('profit_calculation.preview'),
            403
        );

        $request->validate([
            'period_start'         => ['required', 'date'],
            'period_end'           => ['required', 'date', 'after_or_equal:period_start'],
            'distribution_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'source_type'          => ['required', 'in:investment_based,partner_based'],
        ]);

        $periodStart         = $request->input('period_start');
        $periodEnd           = $request->input('period_end');
        $distributionPercent = (float) $request->input('distribution_percent', 100);
        $sourceType          = $request->input('source_type', 'investment_based');

        try {
            $preview = $this->engine->preview(
                $periodStart,
                $periodEnd,
                $distributionPercent,
                $sourceType
            );

            return response()->json($preview);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Calculation failed: ' . $e->getMessage(),
            ], 422);
        }
    }
}
