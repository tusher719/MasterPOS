<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\OrderTask;
use App\Models\Sale;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class OrderTaskController extends Controller
{
    // -------------------------------------------------------------------------
    // Index — paginated list with filters
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        abort_unless(Gate::allows('viewAny', OrderTask::class), 403);

        $query = OrderTask::query()
            ->with([
                'assignedTo:id,name',
                'claimedBy:id,name',
                'createdBy:id,name',
                'completedBy:id,name',
                'linkedSale:id,reference_no',
            ]);

        // Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('customer_name_snapshot', 'like', "%{$search}%")
                    ->orWhere('customer_phone_snapshot', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->filled('status')) {
            $query->byStatus($request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->byPriority($request->input('priority'));
        }

        if ($request->filled('source')) {
            $query->bySource($request->input('source'));
        }

        if ($request->filled('assignment_type')) {
            $query->byAssignmentType($request->input('assignment_type'));
        }

        // My tasks filter — shows tasks assigned to or claimed by current user
        if ($request->boolean('my_tasks')) {
            $userId = Auth::id();
            $query->where(function ($q) use ($userId) {
                $q->where('assigned_to', $userId)
                    ->orWhere('claimed_by', $userId);
            });
        }

        // Overdue filter
        if ($request->boolean('overdue')) {
            $query->overdue();
        }

        $tasks = $query->latest()->paginate(20)->withQueryString();

        // Manually structure pagination — prevents tasks.meta undefined error on frontend
        $tasksPaginated = [
            'data'  => $tasks->items(),
            'meta'  => [
                'current_page' => $tasks->currentPage(),
                'last_page'    => $tasks->lastPage(),
                'per_page'     => $tasks->perPage(),
                'total'        => $tasks->total(),
                'from'         => $tasks->firstItem(),
                'to'           => $tasks->lastItem(),
            ],
            'links' => collect($tasks->links()->toHtml()
                ? $tasks->toArray()['links']
                : []
            )->toArray(),
        ];

        // Stats for header cards
        $stats = [
            'total'    => OrderTask::count(),
            'pending'  => OrderTask::byStatus('pending')->count(),
            'in_progress' => OrderTask::whereIn('status', ['claimed', 'in_progress'])->count(),
            'ready'    => OrderTask::byStatus('ready')->count(),
            'overdue'  => OrderTask::overdue()->count(),
        ];

        // Staff list for assign dropdown (Admin only)
        $staffList = [];
        if (Gate::allows('assign', OrderTask::class)) {
            $staffList = User::select('id', 'name')
                ->whereNull('deleted_at')
                ->where('status', 'active')
                ->orderBy('name')
                ->get();
        }

        $can = [
            'create'   => Gate::allows('create', OrderTask::class),
            'assign'   => Gate::allows('assign', OrderTask::class),
            'claim'    => Gate::allows('claim', OrderTask::class),
            'complete' => Gate::allows('complete', OrderTask::class),
            'delete'   => Gate::allows('delete', OrderTask::class),
        ];

        return Inertia::render('Backend/OrderTasks/Index', [
            'tasks'     => $tasksPaginated,
            'stats'     => $stats,
            'staffList' => $staffList,
            'filters'   => $request->only([
                'search', 'status', 'priority', 'source',
                'assignment_type', 'my_tasks', 'overdue',
            ]),
            'can'       => $can,
        ]);
    }

    // -------------------------------------------------------------------------
    // Store — create new task
    // -------------------------------------------------------------------------

    public function store(Request $request): RedirectResponse
    {
        abort_unless(Gate::allows('create', OrderTask::class), 403);

        $data = $request->validate([
            'title'                   => 'required|string|max:255',
            'customer_name_snapshot'  => 'required|string|max:255',
            'customer_phone_snapshot' => 'nullable|string|max:20',
            'source'                  => 'required|in:facebook,instagram,whatsapp,phone,website,other',
            'priority'                => 'required|in:urgent,normal,flexible',
            'due_date'                => 'nullable|date',
            'note'                    => 'nullable|string|max:2000',
            'assignment_type'         => 'required|in:assigned,open',
            'assigned_to'             => 'nullable|exists:users,id|required_if:assignment_type,assigned',
        ]);

        $task = OrderTask::create([
            ...$data,
            'status'     => 'pending',
            'created_by' => Auth::id(),
        ]);

        ActivityLogService::log(
            'order_tasks',
            'create',
            "Order task created: {$task->title}",
            $task,
            ['customer' => $task->customer_name_snapshot, 'source' => $task->source]
        );

        return redirect()->back()->with('success', 'Task created successfully.');
    }

    // -------------------------------------------------------------------------
    // Update — edit task details (only while not terminal)
    // -------------------------------------------------------------------------

    public function update(Request $request, OrderTask $orderTask): RedirectResponse
    {
        abort_unless(Gate::allows('create', OrderTask::class), 403);

        if ($orderTask->isTerminal()) {
            return redirect()->back()->withErrors(['task' => 'Cannot edit a completed or cancelled task.']);
        }

        $data = $request->validate([
            'title'                   => 'required|string|max:255',
            'customer_name_snapshot'  => 'required|string|max:255',
            'customer_phone_snapshot' => 'nullable|string|max:20',
            'source'                  => 'required|in:facebook,instagram,whatsapp,phone,website,other',
            'priority'                => 'required|in:urgent,normal,flexible',
            'due_date'                => 'nullable|date',
            'note'                    => 'nullable|string|max:2000',
        ]);

        $orderTask->update($data);

        ActivityLogService::log(
            'order_tasks',
            'update',
            "Order task updated: {$orderTask->title}",
            $orderTask,
            $data
        );

        return redirect()->back()->with('success', 'Task updated successfully.');
    }

    // -------------------------------------------------------------------------
    // Assign — admin assigns task to a specific staff member
    // -------------------------------------------------------------------------

    public function assign(Request $request, OrderTask $orderTask): RedirectResponse
    {
        abort_unless(Gate::allows('assign', OrderTask::class), 403);

        if ($orderTask->isTerminal()) {
            return redirect()->back()->withErrors(['task' => 'Cannot assign a completed or cancelled task.']);
        }

        $data = $request->validate([
            'assigned_to'     => 'required|exists:users,id',
            'assignment_type' => 'required|in:assigned,open',
        ]);

        $orderTask->update($data);

        ActivityLogService::log(
            'order_tasks',
            'assign',
            "Order task assigned: {$orderTask->title}",
            $orderTask,
            ['assigned_to' => $data['assigned_to']]
        );

        return redirect()->back()->with('success', 'Task assigned successfully.');
    }

    // -------------------------------------------------------------------------
    // Claim — atomic lock prevents race condition on open tasks
    // -------------------------------------------------------------------------

    public function claim(OrderTask $orderTask): RedirectResponse
    {
        abort_unless(Gate::allows('claim', OrderTask::class), 403);

        if (! $orderTask->isClaimable()) {
            return redirect()->back()->withErrors(['task' => 'This task is no longer available to claim.']);
        }

        try {
            DB::transaction(function () use ($orderTask) {
                // Lock the row — prevents two moderators claiming simultaneously
                $task = OrderTask::where('id', $orderTask->id)->lockForUpdate()->first();

                if ($task->claimed_by !== null) {
                    throw new RuntimeException('This task was just claimed by someone else.');
                }

                if ($task->status !== 'pending') {
                    throw new RuntimeException('This task is no longer in pending status.');
                }

                $task->forceFill([
                    'claimed_by' => Auth::id(),
                    'claimed_at' => now(),
                    'status'     => 'claimed',
                ])->save();
            });
        } catch (RuntimeException $e) {
            return redirect()->back()->withErrors(['task' => $e->getMessage()]);
        }

        ActivityLogService::log(
            'order_tasks',
            'claim',
            "Order task claimed: {$orderTask->title}",
            $orderTask,
            ['claimed_by' => Auth::id()]
        );

        return redirect()->back()->with('success', 'Task claimed successfully.');
    }

    // -------------------------------------------------------------------------
    // UpdateStatus — move task through the status flow
    // -------------------------------------------------------------------------

    public function updateStatus(Request $request, OrderTask $orderTask): RedirectResponse
    {
        abort_unless(Gate::allows('complete', OrderTask::class), 403);

        if ($orderTask->isTerminal()) {
            return redirect()->back()->withErrors(['task' => 'This task is already completed or cancelled.']);
        }

        $data = $request->validate([
            'status' => 'required|in:in_progress,ready,cancelled',
            'note'   => 'nullable|string|max:1000',
        ]);

        $fillable = ['status' => $data['status']];

        // Track when work started
        if ($data['status'] === 'in_progress' && $orderTask->started_at === null) {
            $fillable['started_at'] = now();
        }

        // Track when task was cancelled
        if ($data['status'] === 'cancelled') {
            $fillable['completed_at'] = now();
            $fillable['completed_by'] = Auth::id();
        }

        if (filled($data['note'] ?? null)) {
            $fillable['note'] = $data['note'];
        }

        $orderTask->forceFill($fillable)->save();

        ActivityLogService::log(
            'order_tasks',
            'status_update',
            "Order task status changed to {$data['status']}: {$orderTask->title}",
            $orderTask,
            ['status' => $data['status']]
        );

        return redirect()->back()->with('success', 'Task status updated.');
    }

    // -------------------------------------------------------------------------
    // ConvertToSale — mark task as converted, link the sale
    // -------------------------------------------------------------------------

    public function convertToSale(Request $request, OrderTask $orderTask): RedirectResponse
    {
        abort_unless(Gate::allows('complete', OrderTask::class), 403);

        if ($orderTask->isTerminal()) {
            return redirect()->back()->withErrors(['task' => 'This task is already completed or cancelled.']);
        }

        $data = $request->validate([
            'linked_sale_id' => 'required|exists:sales,id',
        ]);

        $orderTask->forceFill([
            'status'         => 'converted_to_sale',
            'linked_sale_id' => $data['linked_sale_id'],
            'completed_by'   => Auth::id(),
            'completed_at'   => now(),
        ])->save();

        ActivityLogService::log(
            'order_tasks',
            'convert',
            "Order task converted to sale: {$orderTask->title}",
            $orderTask,
            ['linked_sale_id' => $data['linked_sale_id']]
        );

        return redirect()->back()->with('success', 'Task marked as converted to sale.');
    }

    // -------------------------------------------------------------------------
    // Destroy — soft delete
    // -------------------------------------------------------------------------

    public function destroy(OrderTask $orderTask): RedirectResponse
    {
        abort_unless(Gate::allows('delete', OrderTask::class), 403);

        $orderTask->delete();

        ActivityLogService::log(
            'order_tasks',
            'delete',
            "Order task deleted: {$orderTask->title}",
            $orderTask
        );

        return redirect()->back()->with('success', 'Task deleted.');
    }
}
