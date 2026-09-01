<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuickLink extends Model
{
    protected $fillable = [
        'label',
        'icon',
        'route_name',
        'sort_order',
        'is_active',
        'visible_to_roles',
    ];

    protected $casts = [
        'is_active'        => 'boolean',
        'sort_order'       => 'integer',
        'visible_to_roles' => 'array',
    ];

    // ── Scopes ────────────────────────────────────────────────────────────────

    /** Only active links, ordered by sort_order. */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Check if this link is visible to a given set of role names.
     * visible_to_roles = null means visible to everyone.
     */
    public function isVisibleToRoles(array $roleNames): bool
    {
        if ($this->visible_to_roles === null) {
            return true;
        }

        return count(array_intersect($this->visible_to_roles, $roleNames)) > 0;
    }

    /**
     * Check if the route this link points to is registered in Laravel.
     * Used at render time so broken links are skipped gracefully.
     */
    public function routeExists(): bool
    {
        try {
            return \Illuminate\Support\Facades\Route::has($this->route_name);
        } catch (\Throwable) {
            return false;
        }
    }
}
