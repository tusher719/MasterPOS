<?php
// app/Http/Requests/Backend/StoreUnitRequest.php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class StoreUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Unit::class);
    }

    public function rules(): array
    {
        return [
            'name'       => ['required', 'string', 'max:100'],
            'short_code' => ['required', 'string', 'max:20', 'unique:units,short_code'],
            'is_active'  => ['boolean'],
        ];
    }
}
