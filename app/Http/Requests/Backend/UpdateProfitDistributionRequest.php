<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\ProfitDistribution;

class UpdateProfitDistributionRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route model binding resolves the distribution from the URL segment
        $distribution = $this->route('profit_distribution');
        $user = Auth::user();

        // Must have edit permission AND the record must not be locked
        return $user instanceof \Illuminate\Contracts\Auth\Access\Authorizable
            && $user->can('profit_distribution.edit')
            && $distribution instanceof ProfitDistribution
            && ! $distribution->is_locked;
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

            // Financial snapshots — recalculated on recalculate action in Edit form
            'total_revenue'    => ['required', 'numeric', 'min:0'],
            'total_cogs'       => ['required', 'numeric', 'min:0'],
            'total_expenses'   => ['required', 'numeric', 'min:0'],
            'total_investment' => ['required', 'numeric', 'min:0'],
            'gross_profit'     => ['required', 'numeric'],
            'net_profit'       => ['required', 'numeric'],

            // Distribution config
            'distribution_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'distributable_amount' => ['required', 'numeric', 'min:0'],

            // Notes
            'note' => ['nullable', 'string', 'max:2000'],

            // Items — replaced entirely on update (delete + recreate)
            'items'                        => ['required', 'array', 'min:1'],
            'items.*.investment_id'        => ['required', 'integer', 'exists:investments,id'],
            'items.*.investor_name'        => ['required', 'string', 'max:255'],
            'items.*.investment_title'     => ['required', 'string', 'max:255'],
            'items.*.investment_type'      => ['required', 'string', 'max:255'],
            'items.*.invested_amount'      => ['required', 'numeric', 'min:0'],
            'items.*.share_percent'        => ['required', 'numeric', 'min:0', 'max:100'],
            'items.*.share_amount'         => ['required', 'numeric', 'min:0'],
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
