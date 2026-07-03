<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    use AuthorizesRequests;

    // Full notification list page
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', DatabaseNotification::class);

        $filter = $request->get('filter', 'all'); // all | read | unread

        $user = auth('web')->user();
        if (! $user) {
            abort(403);
        }

        $query = DatabaseNotification::where('notifiable_id', $user->getAuthIdentifier())
            ->where('notifiable_type', get_class($user));

        if ($filter === 'read') {
            $query->whereNotNull('read_at');
        } elseif ($filter === 'unread') {
            $query->whereNull('read_at');
        }

        $notifications = $query->latest()->paginate(20)->withQueryString();

        $unreadCount = DatabaseNotification::where('notifiable_id', $user->getAuthIdentifier())
            ->where('notifiable_type', get_class($user))
            ->whereNull('read_at')
            ->count();

        return Inertia::render('Backend/Notifications/Index', [
            // Renamed from 'notifications' -> 'notificationList' so this
            // page-specific prop doesn't collide with (and silently
            // override) the globally-shared 'notifications' prop from
            // HandleInertiaRequests (which the topbar bell dropdown reads).
            'notificationList' => $notifications,
            'filter'           => $filter,
            'unreadCount'      => $unreadCount,
        ]);
    }

    // Mark single notification as read
    public function markRead(string $id): RedirectResponse
    {
        $user = auth('web')->user();
        if (! $user) {
            abort(403);
        }

        $notification = DatabaseNotification::where('notifiable_id', $user->getAuthIdentifier())
            ->where('notifiable_type', get_class($user))
            ->findOrFail($id);
        $this->authorize('view', $notification);

        $notification->markAsRead();

        return back();
    }

    // Mark all notifications as read
    public function markAllRead(): RedirectResponse
    {
        $user = auth('web')->user();
        if (! $user) {
            abort(403);
        }

        DatabaseNotification::where('notifiable_id', $user->getAuthIdentifier())
            ->where('notifiable_type', get_class($user))
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back();
    }

    // Delete single notification
    public function destroy(string $id): RedirectResponse
    {
        $user = auth('web')->user();
        if (! $user) {
            abort(403);
        }

        $notification = DatabaseNotification::where('notifiable_id', $user->getAuthIdentifier())
            ->where('notifiable_type', get_class($user))
            ->findOrFail($id);
        $this->authorize('delete', $notification);

        $notification->delete();

        return back();
    }

    // JSON endpoint — unread count for topbar polling (optional future use)
    public function unreadCount(): JsonResponse
    {
        $user = auth('web')->user();
        if (! $user) {
            abort(403);
        }

        $count = DatabaseNotification::where('notifiable_id', $user->getAuthIdentifier())
            ->where('notifiable_type', get_class($user))
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'count' => $count,
        ]);
    }
}
