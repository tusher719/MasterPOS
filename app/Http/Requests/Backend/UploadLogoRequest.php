<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class UploadLogoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('settings.edit');
    }

    public function rules(): array
    {
        return [
            'logo' => 'required|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
        ];
    }
}
