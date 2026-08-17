<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class ReviewFraudFlagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled in controller via Gate::allows()
    }

    public function rules(): array
    {
        return [
            'action'      => ['required', 'in:confirm,clear'],
            'review_note' => ['required', 'string', 'min:10', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'action.required'      => 'Please select an action.',
            'action.in'            => 'Action must be either confirm or clear.',
            'review_note.required' => 'A review note is required.',
            'review_note.min'      => 'Review note must be at least 10 characters.',
        ];
    }
}
