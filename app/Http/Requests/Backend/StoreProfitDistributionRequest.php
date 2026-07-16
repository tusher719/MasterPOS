<?php

namespace App\Http\Requests\Backend;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreProfitDistributionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = Auth::user();

        return $user instanceof User && $user->hasPermissionTo('profit_distribution.create');
    }

    public function rules(): array
    {
        return [
            // Identity
            'title'             => ['required', 'string', 'max:255'],
            'distribution_date' => ['required', 'date'],

            // Period
            'period_start' => ['required', 'date'],
            'period_end'   => ['required', 'date', 'after_or_equal:period_start'],

            // Financial snapshots — sent from frontend after calculate-preview
            'total_revenue'    => ['required', 'numeric', 'min:0'],
            'total_cogs'       => ['required', 'numeric', 'min:0'],
            'total_expenses'   => ['required', 'numeric', 'min:0'],
            'total_investment' => ['required', 'numeric', 'min:0'],
            'gross_profit'     => ['required', 'numeric'],
            'net_profit'       => ['required', 'numeric'],

            // Distribution config
            'distribution_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'distributable_amount' => ['required', 'numeric', 'min:0'],

            // Source type
            'source_type' => ['required', 'in:investment_based,partner_based'],

            // Notes
            'note' => ['nullable', 'string', 'max:2000'],

            // Items — investment_based requires investment_id, partner_based requires partner_id
            'items'                        => ['required', 'array', 'min:1'],
            'items.*.investment_id'        => ['nullable', 'integer', 'exists:investments,id'],
            'items.*.investor_name'        => ['nullable', 'string', 'max:255'],
            'items.*.investment_title'     => ['nullable', 'string', 'max:255'],
            'items.*.investment_type'      => ['nullable', 'string', 'max:255'],
            'items.*.invested_amount'      => ['nullable', 'numeric', 'min:0'],
            'items.*.partner_id'           => ['nullable', 'integer', 'exists:partners,id'],
            'items.*.partner_name'         => ['nullable', 'string', 'max:255'],
            'items.*.partner_code'         => ['nullable', 'string', 'max:50'],
            'items.*.rule_type'            => ['nullable', 'string', 'max:50'],
            'items.*.profit_source'        => ['nullable', 'string', 'max:50'],
            'items.*.share_percent'        => ['required', 'numeric', 'min:0'],
            'items.*.share_amount'         => ['required', 'numeric', 'min:0'],
            'items.*.cost_return_amount'   => ['nullable', 'numeric', 'min:0'],
            'items.*.settlement_type'      => ['nullable', 'string', 'max:50'],
            'items.*.payment_preference'   => ['nullable', 'string', 'max:50'],
            'items.*.profit_rule_snapshot' => ['nullable', 'array'],
            'items.*.is_eligible'          => ['nullable', 'boolean'],
            'items.*.eligibility_reason'   => ['nullable', 'string', 'max:500'],
            'items.*.note'                 => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'period_end.after_or_equal'    => 'Period end date must be on or after the period start date.',
            'items.required'               => 'At least one investor item is required.',
            'items.min'                    => 'At least one investor item is required.',
            'items.*.investment_id.exists' => 'One or more selected investments are invalid.',
            'distribution_percent.max'     => 'Distribution percent cannot exceed 100%.',
            'distributable_amount.min'     => 'Distributable amount must be a positive value.',
        ];
    }

    public function attributes(): array
    {
        return [
            'title'                => 'Title',
            'distribution_date'    => 'Distribution Date',
            'period_start'         => 'Period Start',
            'period_end'           => 'Period End',
            'total_revenue'        => 'Total Revenue',
            'total_cogs'           => 'Total COGS',
            'total_expenses'       => 'Total Expenses',
            'total_investment'     => 'Total Investment',
            'gross_profit'         => 'Gross Profit',
            'net_profit'           => 'Net Profit',
            'distribution_percent' => 'Distribution Percent',
            'distributable_amount' => 'Distributable Amount',
            'items.*.investor_name'    => 'Investor Name',
            'items.*.investment_title' => 'Investment Title',
            'items.*.invested_amount'  => 'Invested Amount',
            'items.*.share_percent'    => 'Share Percent',
            'items.*.share_amount'     => 'Share Amount',
        ];
    }
}
