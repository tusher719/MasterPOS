<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;

class AuditTrailController extends Controller
{
    public function index(Request $request)
    {
        // Use gate-based check to avoid undefined permission methods on the user model
        abort_unless(Gate::allows('audit_trail.view'), 403);

        // --- Build query ---
        $query = ActivityLog::with(['user' => fn($q) => $q->withTrashed()])
            ->latest();

        // Search by description
        if ($request->filled('search')) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        // Filter by module
        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        // Filter by action
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        // Filter by user
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate(50)->withQueryString();

        // --- Filter options (dynamic from DB) ---
        $modules = ActivityLog::distinct()
            ->orderBy('module')
            ->pluck('module')
            ->filter()
            ->values();

        $actions = ActivityLog::distinct()
            ->orderBy('action')
            ->pluck('action')
            ->filter()
            ->values();

        $users = User::withTrashed()
            ->whereIn('id', ActivityLog::distinct()->pluck('user_id')->filter())
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Backend/AuditTrail/Index', [
            'logs'    => $logs,
            'modules' => $modules,
            'actions' => $actions,
            'users'   => $users,
            'filters' => $request->only([
                'search', 'module', 'action', 'user_id', 'date_from', 'date_to',
            ]),
        ]);
    }
}
