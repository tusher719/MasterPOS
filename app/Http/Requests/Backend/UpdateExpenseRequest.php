<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'               => ['required', 'string', 'max:255'],
            'expense_category_id' => ['required', 'integer', 'exists:expense_categories,id'],
            'payment_method_id'   => ['nullable', 'integer', 'exists:payment_methods,id'],
            'amount'              => ['required', 'numeric', 'min:0.01', 'max:99999999.99'],
            'expense_date'        => ['required', 'date'],
            'reference'           => ['nullable', 'string', 'max:255'],
            'attachment'          => [
                'nullable',
                'file',
                'mimes:jpeg,jpg,png,gif,pdf,doc,docx',
                'max:2048',
            ],
            'remove_attachment'   => ['nullable', 'boolean'],
            'note'                => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'               => 'Expense title is required.',
            'expense_category_id.required' => 'Please select a category.',
            'expense_category_id.exists'   => 'Selected category does not exist.',
            'payment_method_id.exists'     => 'Selected payment method does not exist.',
            'amount.required'              => 'Amount is required.',
            'amount.min'                   => 'Amount must be greater than zero.',
            'expense_date.required'        => 'Expense date is required.',
            'expense_date.date'            => 'Please enter a valid date.',
            'attachment.mimes'             => 'Attachment must be jpeg, png, gif, pdf, doc, or docx.',
            'attachment.max'               => 'Attachment size must not exceed 2MB.',
        ];
    }
}
