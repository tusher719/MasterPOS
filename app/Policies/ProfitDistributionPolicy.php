<?php

namespace App\Policies;

use App\Models\ProfitDistribution;
use App\Models\User;

class ProfitDistributionPolicy
{
    // -----------------------------------------------------------------------
    // Class-level gates (no model instance — Rule #18)
    // -----------------------------------------------------------------------

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('profit_distribution.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('profit_distribution.create');
    }

    // -----------------------------------------------------------------------
    // Instance-level gates
    // -----------------------------------------------------------------------

    public function view(User $user, ProfitDistribution $distribution): bool
    {
        return $user->hasPermissionTo('profit_distribution.view');
    }

    /**
     * Edit is only allowed when the record is NOT locked (draft status).
     * is_locked becomes true on approve — enforced here so both the
     * controller and UI can rely on a single source of truth.
     */
    public function edit(User $user, ProfitDistribution $distribution): bool
    {
        return $user->hasPermissionTo('profit_distribution.edit')
            && ! $distribution->is_locked;
    }

    /**
     * Update mirrors edit — same lock check.
     */
    public function update(User $user, ProfitDistribution $distribution): bool
    {
        return $user->hasPermissionTo('profit_distribution.edit')
            && ! $distribution->is_locked;
    }

    /**
     * Delete is blocked when locked (approved / distributed).
     * Soft-deleted records cannot be deleted again.
     */
    public function delete(User $user, ProfitDistribution $distribution): bool
    {
        return $user->hasPermissionTo('profit_distribution.delete')
            && ! $distribution->is_locked;
    }

    public function restore(User $user): bool
    {
        return $user->hasPermissionTo('profit_distribution.restore');
    }

    /**
     * Approve: only from 'draft' status.
     * Distribute: only from 'approved' status.
     * Both actions share the profit_distribution.approve permission.
     */
    public function approve(User $user, ProfitDistribution $distribution): bool
    {
        return $user->hasPermissionTo('profit_distribution.approve')
            && $distribution->status === 'draft';
    }

    public function distribute(User $user, ProfitDistribution $distribution): bool
    {
        return $user->hasPermissionTo('profit_distribution.approve')
            && $distribution->status === 'approved';
    }

    /**
     * Mark an item as paid / cancelled.
     * Allowed once the distribution is approved or distributed.
     * Reuses profit_distribution.approve permission — only privileged
     * users should update individual payment records.
     */
    public function updateItemPayment(User $user, ProfitDistribution $distribution): bool
    {
        return $user->hasPermissionTo('profit_distribution.approve')
            && in_array($distribution->status, ['approved', 'distributed']);
    }
}
