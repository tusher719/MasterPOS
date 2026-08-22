<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\OrderTask;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class StaffPerformanceReportController extends Controller
{
    public function index(Request $request)
    {
        abort_unless(Gate::allows('order_task.view'), 403);

        // --- Build filters from request ---
        $userId    = $request->input('user_id');       // specific staff/moderator
        $dateFrom  = $request->input('date_from');     // created_at range start (YYYY-MM-DD)
        $dateTo    = $request->input('date_to');       // created_at range end
        $source    = $request->input('source');        // facebook|instagram|whatsapp|phone|website|other
        $status    = $request->input('status');        // pending|claimed|in_progress|ready|converted_to_sale|cancelled

        // --- Staff/Moderator list for filter dropdown ---
        // Only users who have ever touched an order task (assigned, claimed, created, completed)
        $staffOptions = User::whereNull('deleted_at')
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        // --- Base query: one row per staff member involved in tasks ---
        // We aggregate by user — either as assigned_to OR claimed_by
        // A user can appear on both columns; we union and group.
        $rows = $this->buildPerformanceRows($userId, $dateFrom, $dateTo, $source, $status);

        // --- Summary totals across all displayed staff ---
        $summary = [
            'total_tasks'           => array_sum(array_column($rows, 'total_tasks')),
            'total_completed'       => array_sum(array_column($rows, 'completed')),
            'total_cancelled'       => array_sum(array_column($rows, 'cancelled')),
            'avg_completion_minutes'=> count($rows)
                ? round(array_sum(array_column($rows, 'avg_completion_minutes')) / count($rows))
                : 0,
        ];

        return Inertia::render('Backend/OrderTasks/StaffPerformanceReport', [
            'rows'         => $rows,
            'summary'      => $summary,
            'staffOptions' => $staffOptions,
            'filters'      => [
                'user_id'   => $userId,
                'date_from' => $dateFrom,
                'date_to'   => $dateTo,
                'source'    => $source,
                'status'    => $status,
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // Build per-staff performance rows
    // -------------------------------------------------------------------------
    private function buildPerformanceRows(
        ?string $userId,
        ?string $dateFrom,
        ?string $dateTo,
        ?string $source,
        ?string $status
    ): array {
        // Collect all relevant task IDs first (with optional filters applied)
        $taskQuery = OrderTask::query()->whereNull('deleted_at');

        if ($dateFrom) {
            $taskQuery->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $taskQuery->whereDate('created_at', '<=', $dateTo);
        }
        if ($source) {
            $taskQuery->where('source', $source);
        }
        if ($status) {
            $taskQuery->where('status', $status);
        }

        // Get all tasks matching filters
        $tasks = $taskQuery->get([
            'id', 'status', 'assignment_type',
            'assigned_to', 'claimed_by', 'claimed_at', 'started_at',
            'completed_at', 'created_at',
        ]);

        // Collect unique user IDs who appear as assigned_to or claimed_by
        $userIds = $tasks->pluck('assigned_to')->merge($tasks->pluck('claimed_by'))
            ->filter()
            ->unique()
            ->values();

        // Filter to a specific user if requested
        if ($userId) {
            $userIds = $userIds->filter(fn($id) => (string)$id === (string)$userId)->values();
        }

        if ($userIds->isEmpty()) {
            return [];
        }

        // Load user names
        $users = User::withTrashed()
            ->whereIn('id', $userIds)
            ->get(['id', 'name'])
            ->keyBy('id');

        $rows = [];

        foreach ($userIds as $uid) {
            $user = $users->get($uid);
            if (!$user) {
                continue;
            }

            // Tasks where this user was involved (assigned OR claimed)
            $userTasks = $tasks->filter(
                fn($t) => $t->assigned_to == $uid || $t->claimed_by == $uid
            );

            // Assigned tasks (assignment_type = assigned, assigned_to = this user)
            $assignedCount = $userTasks->where('assignment_type', 'assigned')
                ->where('assigned_to', $uid)
                ->count();

            // Claimed tasks (open tasks claimed by this user)
            $claimedCount = $userTasks->where('claimed_by', $uid)->count();

            // Completed = converted_to_sale OR ready (terminal positive outcomes)
            $completed = $userTasks->whereIn('status', ['converted_to_sale', 'ready'])->count();

            // In progress count
            $inProgress = $userTasks->where('status', 'in_progress')->count();

            // Cancelled count
            $cancelled = $userTasks->where('status', 'cancelled')->count();

            // Avg completion time in minutes
            // Time = completed_at - claimed_at (if claimed_at exists), else completed_at - started_at
            $completedTasks = $userTasks->whereIn('status', ['converted_to_sale', 'ready'])
                ->filter(fn($t) => $t->completed_at !== null);

            $totalMinutes = 0;
            $countForAvg  = 0;

            foreach ($completedTasks as $t) {
                $start = $t->claimed_at ?? $t->started_at;
                if ($start && $t->completed_at) {
                    $diff = $t->completed_at->diffInMinutes($start);
                    $totalMinutes += $diff;
                    $countForAvg++;
                }
            }

            $avgMinutes = $countForAvg > 0 ? round($totalMinutes / $countForAvg) : 0;

            $rows[] = [
                'user_id'                => $uid,
                'user_name'              => $user->name,
                'total_tasks'            => $userTasks->count(),
                'assigned'               => $assignedCount,
                'claimed'                => $claimedCount,
                'in_progress'            => $inProgress,
                'completed'              => $completed,
                'cancelled'              => $cancelled,
                'avg_completion_minutes' => $avgMinutes,
            ];
        }

        // Sort by completed desc (best performers first)
        usort($rows, fn($a, $b) => $b['completed'] <=> $a['completed']);

        return $rows;
    }
}
