<?php

namespace App\Policies;

use App\Models\User;

class SalePolicy
{
    // ─── Before Hook ──────────────────────────────────────────────

    public function before(User $user, string $ability): bool|null
    {
        // Super admin bypass (optional — remove if not needed)
        return null;
    }

    // ─── Policy Methods ───────────────────────────────────────────

    /**
     * View POS terminal and sales list.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('sale.view');
    }

    /**
     * Create a new sale.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('sale.create');
    }

    /**
     * Void (soft delete) a sale.
     * No model instance parameter — controller calls can('delete', Sale::class).
     */
    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('sale.delete');
    }

    /**
     * Restore a voided sale.
     * No model instance parameter — controller calls can('restore', Sale::class).
     */
    public function restore(User $user): bool
    {
        return $user->hasPermissionTo('sale.restore');
    }
}
