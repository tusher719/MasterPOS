<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;

class NotificationPolicy
{
    // Admin can view all notifications, others only their own
    public function view(User $user, DatabaseNotification $notification): bool
    {
        return $user->hasRole('Admin') || $notification->notifiable_id === $user->id;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('notification.view');
    }

    // Admin can delete any, others only their own
    public function delete(User $user, DatabaseNotification $notification): bool
    {
        return $user->hasRole('Admin') || $notification->notifiable_id === $user->id;
    }
}
