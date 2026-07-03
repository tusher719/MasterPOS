<?php
// app/Http/Requests/Backend/UpdateUnitRequest.php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('unit'));
    }

    public function rules(): array
    {
        $unitId = $this->route('unit')?->id;

        return [
            'name'       => ['required', 'string', 'max:100'],
            'short_code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('units', 'short_code')->ignore($unitId),
            ],
            'is_active'  => ['boolean'],
        ];
    }
}
