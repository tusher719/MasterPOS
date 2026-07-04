<?php

// app/Policies/PurchasePolicy.php

namespace App\Policies;

use App\Models\Purchase;
use App\Models\User;

class PurchasePolicy
{
    // ─── Before Hook ──────────────────────────────────────────────────────────
    // Handles class-level checks (no model instance) for bulk/utility actions

    public function before(User $user, string $ability): ?bool
    {
        $classLevelAbilities = [
            'bulkDelete'       => 'purchase.delete',
            'bulkRestore'      => 'purchase.restore',
            'bulkStatusChange' => 'purchase.edit',
            'duplicate'        => 'purchase.create',
            'exportOrPrint'    => 'purchase.view',
        ];

        if (array_key_exists($ability, $classLevelAbilities)) {
            return $user->hasPermissionTo($classLevelAbilities[$ability]);
        }

        return null; // fall through to individual methods
    }

    // ─── Standard Abilities ───────────────────────────────────────────────────

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('purchase.view');
    }

    public function view(User $user, Purchase $purchase): bool
    {
        return $user->hasPermissionTo('purchase.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('purchase.create');
    }

    public function update(User $user, Purchase $purchase): bool
    {
        // Cannot edit a cancelled or fully received purchase
        if (in_array($purchase->purchase_status, ['cancelled', 'received'])) {
            return false;
        }

        return $user->hasPermissionTo('purchase.edit');
    }

    public function delete(User $user, Purchase $purchase): bool
    {
        return $user->hasPermissionTo('purchase.delete');
    }

    public function restore(User $user, Purchase $purchase): bool
    {
        return $user->hasPermissionTo('purchase.restore');
    }

    public function forceDelete(User $user, Purchase $purchase): bool
    {
        return false; // force delete never allowed from UI
    }

    public function managePayment(User $user, Purchase $purchase): bool
    {
        // Can only record payment if there is an outstanding due amount
        if ($purchase->due_amount <= 0) {
            return false;
        }

        return $user->hasPermissionTo('purchase.payment');
    }

    public function duplicate(User $user): bool
    {
        return $user->hasPermissionTo('purchase.create');
    }

    public function exportOrPrint(User $user): bool
    {
        return $user->hasPermissionTo('purchase.view');
    }

    // ─── Bulk Abilities ───────────────────────────────────────────────────────

    public function bulkDelete(User $user): bool
    {
        return $user->hasPermissionTo('purchase.delete');
    }

    public function bulkRestore(User $user): bool
    {
        return $user->hasPermissionTo('purchase.restore');
    }

    public function bulkStatusChange(User $user): bool
    {
        return $user->hasPermissionTo('purchase.edit');
    }
}
