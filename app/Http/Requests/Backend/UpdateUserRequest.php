<?php

namespace App\Http\Requests\Backend;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('users.edit');
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name'     => "required|string|max:255",
            'email'    => "required|email|max:255|unique:users,email,{$userId}",
            'phone'    => "nullable|string|max:20",
            'status'   => "required|in:active,inactive",
            'password' => "nullable|string|min:8|confirmed",
            'roles'    => "nullable|array",
            'roles.*'  => "string|exists:roles,name",
        ];
    }
}
