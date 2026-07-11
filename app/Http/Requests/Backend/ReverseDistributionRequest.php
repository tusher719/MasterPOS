<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class ReverseDistributionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled in controller
    }

    public function rules(): array
    {
        return [
            'reason' => [
                'required',
                'string',
                'min:10',
                'max:1000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'A reason is required to reverse a distribution.',
            'reason.min'      => 'Reason must be at least 10 characters.',
            'reason.max'      => 'Reason must not exceed 1000 characters.',
        ];
    }
}
