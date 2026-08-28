<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Investment;
use App\Models\ProfitDistribution;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class InvestmentDashboardController extends Controller
{
    public function data(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'period'    => 'nullable|in:today,this_week,this_month,this_year,custom',
            'date_from' => 'nullable|date|required_if:period,custom',
            'date_to'   => 'nullable|date|required_if:period,custom|after_or_equal:date_from',
        ]);

        $period = $request->input('period', 'this_month');
        [$from, $to] = $this->resolvePeriod($period, $request);

        return response()->json([
            'period'               => [
                'type' => $period,
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
            ],
            'kpis'                 => $this->kpis($from, $to),
            'capital_summary'      => $this->capitalSummary(),
            'profit_summary'       => $this->profitSummary($from, $to),
            'investments_list'     => $this->investmentsList(),
            'distributions_list'   => $this->distributionsList($from, $to),
            'capital_trend'        => $this->capitalTrend($from, $to),
            'distribution_trend'   => $this->distributionTrend($from, $to),
            'partner_balances'     => $this->partnerBalances(),
        ]);
    }

    // ── Period helper ─────────────────────────────────────────────────────────

    private function resolvePeriod(string $period, Request $request): array
    {
        $now = Carbon::now();

        return match ($period) {
            'today'     => [Carbon::today(), Carbon::today()->endOfDay()],
            'this_week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'this_year' => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
            'custom'    => [
                Carbon::parse($request->date_from)->startOfDay(),
                Carbon::parse($request->date_to)->endOfDay(),
            ],
            default     => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
        };
    }

    // ── KPIs ──────────────────────────────────────────────────────────────────

    private function kpis(Carbon $from, Carbon $to): array
    {
        // All-time capital
        $totalInvestment = Investment::whereNull('deleted_at')
            ->sum('amount');

        $activeInvestment = Investment::whereNull('deleted_at')
            ->where('status', 'active')
            ->sum('amount');

        $investorCount = Investment::whereNull('deleted_at')
            ->where('status', 'active')
            ->count();

        // All-time distributions
        $totalDistributed = ProfitDistribution::whereNull('deleted_at')
            ->where('status', 'distributed')
            ->sum('distributable_amount');

        // Period distributions
        $periodDistributed = ProfitDistribution::whereNull('deleted_at')
            ->where('status', 'distributed')
            ->whereBetween('distribution_date', [$from->toDateString(), $to->toDateString()])
            ->sum('distributable_amount');

        // Pending (draft/approved not yet distributed)
        $pendingDistributions = ProfitDistribution::whereNull('deleted_at')
            ->whereIn('status', ['draft', 'approved'])
            ->count();

        // Capital ledger: total withdrawn (all-time)
        $totalWithdrawn = DB::table('capital_ledger_entries')
            ->where('transaction_type', 'withdrawal')
            ->where('status', 'approved')
            ->sum('amount');

        // Partner count
        $partnerCount = DB::table('partners')
            ->whereNull('deleted_at')
            ->where('is_active', true)
            ->count();

        return [
            'total_investment'      => round($totalInvestment, 2),
            'active_investment'     => round($activeInvestment, 2),
            'investor_count'        => $investorCount,
            'total_distributed'     => round($totalDistributed, 2),
            'period_distributed'    => round($periodDistributed, 2),
            'pending_distributions' => $pendingDistributions,
            'total_withdrawn'       => round($totalWithdrawn, 2),
            'partner_count'         => $partnerCount,
        ];
    }

    // ── Capital summary per investor ──────────────────────────────────────────

    private function capitalSummary(): \Illuminate\Support\Collection
    {
        return DB::table('investor_capital_balances')
            ->join('investments', 'investor_capital_balances.investment_id', '=', 'investments.id')
            ->whereNull('investments.deleted_at')
            ->select(
                'investments.id',
                'investments.investor_name',
                'investments.investment_date',
                'investments.status',
                'investor_capital_balances.total_deposited',
                'investor_capital_balances.total_withdrawn',
                'investor_capital_balances.current_balance',
                'investor_capital_balances.unlocked_amount',
                'investor_capital_balances.locked_amount'
            )
            ->orderByDesc('investor_capital_balances.total_deposited')
            ->get();
    }

    // ── Profit summary for period ─────────────────────────────────────────────

    private function profitSummary(Carbon $from, Carbon $to): array
    {
        $dateRange = [$from->toDateString(), $to->toDateString()];

        $distributions = ProfitDistribution::whereNull('deleted_at')
            ->whereBetween('distribution_date', $dateRange)
            ->get();

        $byStatus = $distributions->groupBy('status')->map->count();

        $totalNetProfit = $distributions->where('status', 'distributed')->sum('net_profit');
        $totalDistributable = $distributions->where('status', 'distributed')->sum('distributable_amount');

        return [
            'draft_count'        => $byStatus->get('draft', 0),
            'approved_count'     => $byStatus->get('approved', 0),
            'distributed_count'  => $byStatus->get('distributed', 0),
            'total_net_profit'   => round($totalNetProfit, 2),
            'total_distributable'=> round($totalDistributable, 2),
        ];
    }

    // ── Investments list ──────────────────────────────────────────────────────

    private function investmentsList(): \Illuminate\Support\Collection
    {
        return DB::table('investments')
            ->leftJoin('investment_types', 'investments.investment_type_id', '=', 'investment_types.id')
            ->leftJoin('investor_capital_balances', 'investments.id', '=', 'investor_capital_balances.investment_id')
            ->leftJoin('investor_profit_balances', 'investments.id', '=', 'investor_profit_balances.investment_id')
            ->whereNull('investments.deleted_at')
            ->select(
                'investments.id',
                'investments.investor_name',
                'investments.amount',
                'investments.investment_date',
                'investments.status',
                'investment_types.name as type_name',
                'investor_capital_balances.current_balance',
                'investor_profit_balances.pending_balance as pending_profit'
            )
            ->orderByDesc('investments.amount')
            ->get();
    }

    // ── Recent distributions ──────────────────────────────────────────────────

    private function distributionsList(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return DB::table('profit_distributions')
            ->whereNull('deleted_at')
            ->whereBetween('distribution_date', [$from->toDateString(), $to->toDateString()])
            ->select(
                'id',
                'distribution_no',
                'title',
                'distribution_date',
                'period_start',
                'period_end',
                'net_profit',
                'distributable_amount',
                'status',
                'source_type'
            )
            ->orderByDesc('distribution_date')
            ->limit(15)
            ->get();
    }

    // ── Capital ledger trend (deposits/withdrawals) ───────────────────────────

    private function capitalTrend(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        $days = $from->diffInDays($to) + 1;

        $groupBy  = $days <= 60
            ? "DATE(created_at)"
            : "DATE_FORMAT(created_at, '%Y-%m')";
        $labelFmt = $days <= 60
            ? "DATE(created_at)"
            : "DATE_FORMAT(created_at, '%Y-%m')";

        return DB::table('capital_ledger_entries')
            ->whereIn('status', ['completed', 'approved'])
            ->whereBetween('created_at', [$from, $to])
            ->groupBy(DB::raw($groupBy), 'direction')
            ->select(
                DB::raw("$labelFmt as label"),
                'direction',
                DB::raw('SUM(amount) as total')
            )
            ->orderBy('label')
            ->get();
    }

    // ── Distribution trend over period ────────────────────────────────────────

    private function distributionTrend(Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        $days = $from->diffInDays($to) + 1;

        if ($days <= 60) {
            return DB::table('profit_distributions')
                ->whereNull('deleted_at')
                ->where('status', 'distributed')
                ->whereBetween('distribution_date', [$from->toDateString(), $to->toDateString()])
                ->groupBy('distribution_date')
                ->select(
                    'distribution_date as label',
                    DB::raw('SUM(distributable_amount) as total'),
                    DB::raw('COUNT(*) as count')
                )
                ->orderBy('distribution_date')
                ->get();
        }

        return DB::table('profit_distributions')
            ->whereNull('deleted_at')
            ->where('status', 'distributed')
            ->whereBetween('distribution_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy(DB::raw("DATE_FORMAT(distribution_date, '%Y-%m')"))
            ->select(
                DB::raw("DATE_FORMAT(distribution_date, '%Y-%m') as label"),
                DB::raw('SUM(distributable_amount) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->orderBy('label')
            ->get();
    }

    // ── Partner profit balances ───────────────────────────────────────────────

    private function partnerBalances(): \Illuminate\Support\Collection
    {
        return DB::table('partner_profit_balances')
            ->join('partners', 'partner_profit_balances.partner_id', '=', 'partners.id')
            ->whereNull('partners.deleted_at')
            ->select(
                'partners.id',
                'partners.name',
                'partners.code',
                'partner_profit_balances.total_profit_earned',
                'partner_profit_balances.total_profit_paid',
                'partner_profit_balances.pending_profit_balance',
                'partner_profit_balances.total_cost_returned',
                'partner_profit_balances.pending_cost_balance'
            )
            ->orderByDesc('partner_profit_balances.pending_profit_balance')
            ->get();
    }
}
