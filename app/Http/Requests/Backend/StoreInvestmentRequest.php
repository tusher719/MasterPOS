<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvestmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'investment_type_id' => ['required', 'integer', 'exists:investment_types,id'],
            'title'              => ['required', 'string', 'max:255'],
            'investor_name'      => ['required', 'string', 'max:255'],
            'amount'             => ['required', 'numeric', 'min:0.01', 'max:99999999.99'],
            'investment_date'    => ['required', 'date'],
            'reference'          => ['nullable', 'string', 'max:255'],
            'attachment'         => ['nullable', 'file', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xlsx', 'max:5120'],
            'note'               => ['nullable', 'string', 'max:2000'],
            'status'             => ['required', 'in:active,withdrawn'],
        ];
    }

    public function messages(): array
    {
        return [
            'investment_type_id.required' => 'Investment type is required.',
            'investment_type_id.exists'   => 'Selected investment type does not exist.',
            'title.required'              => 'Title is required.',
            'investor_name.required'      => 'Investor name is required.',
            'amount.required'             => 'Amount is required.',
            'amount.min'                  => 'Amount must be greater than zero.',
            'investment_date.required'    => 'Investment date is required.',
            'attachment.mimes'            => 'Attachment must be a jpg, png, gif, webp, pdf, doc, docx, or xlsx file.',
            'attachment.max'              => 'Attachment must not exceed 5MB.',
            'status.in'                   => 'Status must be active or withdrawn.',
        ];
    }
}
