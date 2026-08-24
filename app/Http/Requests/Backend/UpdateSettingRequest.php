<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('settings.edit');
    }

    public function rules(): array
    {
        return match ($this->input('group')) {
            'business' => [
                'group'               => 'required|string',
                'business_name'       => 'sometimes|required|string|max:255',
                'business_email'      => 'nullable|email|max:255',
                'business_phone'      => 'nullable|string|max:50',
                'business_address'    => 'nullable|string|max:500',
                'logo_type'           => 'sometimes|in:image,text,both',
                'logo_text_segments'  => 'sometimes|nullable|string',
            ],
            'currency' => [
                'group'             => 'required|string',
                'business_currency' => 'required|string|max:10',
                'currency_symbol'   => 'required|string|max:10',
                'currency_position' => 'required|in:before,after',
                'decimal_places'    => 'required|integer|min:0|max:4',
            ],
            'tax' => [
                'group'         => 'required|string',
                'tax_enabled'   => 'required|in:true,false',
                'tax_name'      => 'nullable|string|max:50',
                'tax_rate'      => 'nullable|numeric|min:0|max:100',
                'tax_inclusive' => 'required|in:true,false',
            ],
            'notification' => [
                'group'               => 'required|string',
                'notify_on_sale'      => 'required|in:true,false',
                'notify_low_stock'    => 'required|in:true,false',
                'notify_on_expense'   => 'required|in:true,false',
                'low_stock_threshold' => 'required|integer|min:1|max:9999',
            ],
            default => [
                'group' => 'required|string',
            ],
        };
    }
}
