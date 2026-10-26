<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStorefrontBannerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'        => ['required', 'string', 'max:150'],
            'subtitle'     => ['nullable', 'string', 'max:500'],
            'badge_text'   => ['nullable', 'string', 'max:60'],
            'image'        => ['required', 'image', 'mimes:jpeg,png,jpg,webp,svg', 'max:4096'],
            'link_url'     => ['nullable', 'string', 'max:255'],
            'button_text'  => ['nullable', 'string', 'max:60'],
            'coupon_code'  => ['nullable', 'string', 'max:50'],
            'placement'    => ['required', 'in:hero_slider,promo_strip,popup_banner'],
            'bg_color'     => ['nullable', 'string', 'max:30'],
            'sort_order'   => ['nullable', 'integer', 'min:0'],
            'is_active'    => ['boolean'],
            'starts_at'    => ['nullable', 'date'],
            'expires_at'   => ['nullable', 'date', 'after_or_equal:starts_at'],
        ];
    }
}
