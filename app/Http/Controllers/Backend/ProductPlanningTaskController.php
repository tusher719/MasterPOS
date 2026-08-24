<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreProductPlanningTaskRequest;
use App\Http\Requests\Backend\UpdateProductPlanningTaskRequest;
use App\Models\Product;
use App\Models\ProductPlanningTask;
use App\Models\ProductPlanningTaskItem;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ProductPlanningTaskController extends Controller
{
    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        abort_unless(Gate::allows('product_task.view'), 403);

        $query = ProductPlanningTask::with([
            'items.product',
            'createdBy',
            'assignedTo',
            'completedBy',
        ]);

        // Trashed filter
        if ($request->boolean('trashed')) {
            $query->onlyTrashed();
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('title', 'like', "%{$search}%");
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Assigned to filter
        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        $tasks = $query->orderByDesc('created_at')->paginate(15)->withQueryString();

        // Map relations to named keys frontend expects
        $tasks->getCollection()->transform(function ($task) {
            $task->assigned_to_user  = $task->assignedTo;
            $task->created_by_user   = $task->createdBy;
            $task->completed_by_user = $task->completedBy;
            return $task;
        });

        // Stats
        $stats = [
            'total'       => ProductPlanningTask::count(),
            'pending'     => ProductPlanningTask::where('status', 'pending')->count(),
            'in_progress' => ProductPlanningTask::where('status', 'in_progress')->count(),
            'done'        => ProductPlanningTask::where('status', 'done')->count(),
            'cancelled'   => ProductPlanningTask::where('status', 'cancelled')->count(),
            'overdue'     => ProductPlanningTask::overdue()->count(),
        ];

        // Staff options for assign filter
        $staffOptions = User::where('status', 'active')
            ->whereNull('deleted_at')
            ->orderBy('name')
            ->get(['id', 'name']);

        // Active products with active variants for item rows
        $products = Product::where('is_active', true)
            ->whereNull('deleted_at')
            ->with(['activeVariants'])
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'cost_price', 'has_variants']);

        return Inertia::render('Backend/ProductPlanningTasks/Index', [
            'tasks'       => $tasks,
            'stats'       => $stats,
            'staffOptions' => $staffOptions,
            'products'    => $products,
            'filters'     => $request->only(['search', 'status', 'assigned_to', 'trashed']),
            'can'         => [
                'create'  => Gate::allows('product_task.create'),
                'edit'    => Gate::allows('product_task.edit'),
                'delete'  => Gate::allows('product_task.delete'),
            ],
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    public function store(StoreProductPlanningTaskRequest $request)
    {
        abort_unless(Gate::allows('product_task.create'), 403);

        DB::transaction(function () use ($request) {
            $task = ProductPlanningTask::create([
                'title'       => $request->title,
                'note'        => $request->note,
                'due_date'    => $request->due_date,
                'assigned_to' => $request->assigned_to,
                'created_by'  => Auth::id(),
            ]);

            // Set initial status via forceFill (Rule 66)
            $task->forceFill(['status' => 'pending'])->save();

            // Create items
            foreach ($request->items as $item) {
                ProductPlanningTaskItem::create([
                    'task_id'    => $task->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'quantity'   => $item['quantity'],
                    'unit_cost'  => $item['unit_cost'] ?? null,
                    'note'       => $item['note'] ?? null,
                    'status'     => $item['status'] ?? 'pending',
                ]);
            }

            ActivityLogService::log(
                'product_planning_tasks',
                'create',
                "Created planning task: {$task->title}",
                $task,
                ['title' => $task->title, 'items_count' => count($request->items)]
            );
        });

        return redirect()->back()->with('success', 'Planning task created successfully.');
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(UpdateProductPlanningTaskRequest $request, ProductPlanningTask $productPlanningTask)
    {
        abort_unless(Gate::allows('product_task.edit'), 403);

        DB::transaction(function () use ($request, $productPlanningTask) {
            $productPlanningTask->update([
                'title'       => $request->title,
                'note'        => $request->note,
                'due_date'    => $request->due_date,
                'assigned_to' => $request->assigned_to,
            ]);

            // Sync items — delete removed, upsert existing/new
            $incomingIds = collect($request->items)
                ->pluck('id')
                ->filter()
                ->values()
                ->toArray();

            // Delete items not in incoming list
            $productPlanningTask->items()
                ->whereNotIn('id', $incomingIds)
                ->delete();

            foreach ($request->items as $item) {
                if (!empty($item['id'])) {
                    // Update existing item
                    ProductPlanningTaskItem::where('id', $item['id'])
                        ->where('task_id', $productPlanningTask->id)
                        ->update([
                            'product_id' => $item['product_id'],
                            'variant_id' => $item['variant_id'] ?? null,
                            'quantity'   => $item['quantity'],
                            'unit_cost'  => $item['unit_cost'] ?? null,
                            'note'       => $item['note'] ?? null,
                            'status'     => $item['status'] ?? 'pending',
                        ]);
                } else {
                    // Create new item
                    ProductPlanningTaskItem::create([
                        'task_id'    => $productPlanningTask->id,
                        'product_id' => $item['product_id'],
                        'variant_id' => $item['variant_id'] ?? null,
                        'quantity'   => $item['quantity'],
                        'unit_cost'  => $item['unit_cost'] ?? null,
                        'note'       => $item['note'] ?? null,
                        'status'     => $item['status'] ?? 'pending',
                    ]);
                }
            }

            ActivityLogService::log(
                'product_planning_tasks',
                'update',
                "Updated planning task: {$productPlanningTask->title}",
                $productPlanningTask,
                ['title' => $productPlanningTask->title]
            );
        });

        return redirect()->back()->with('success', 'Planning task updated successfully.');
    }

    // ─── Update Status ────────────────────────────────────────────────────────

    public function updateStatus(Request $request, ProductPlanningTask $productPlanningTask)
    {
        abort_unless(Gate::allows('product_task.edit'), 403);

        $request->validate([
            'status' => ['required', 'in:pending,in_progress,done,cancelled'],
            'note'   => ['nullable', 'string', 'max:500'],
        ]);

        // Guard: terminal tasks cannot change status
        if ($productPlanningTask->isTerminal()) {
            return redirect()->back()->with('error', 'This task is already in a terminal status.');
        }

        // Guard: same status
        if ($productPlanningTask->status === $request->status) {
            return redirect()->back()->with('error', 'Task is already in this status.');
        }

        $completedAt = null;
        $completedBy = null;

        if ($request->status === 'done') {
            $completedAt = now();
            $completedBy = Auth::id();
        }

        $productPlanningTask->forceFill([
            'status'       => $request->status,
            'completed_at' => $completedAt,
            'completed_by' => $completedBy,
        ])->save();

        ActivityLogService::log(
            'product_planning_tasks',
            'update_status',
            "Changed planning task status to {$request->status}: {$productPlanningTask->title}",
            $productPlanningTask,
            ['status' => $request->status, 'note' => $request->note]
        );

        return redirect()->back()->with('success', 'Task status updated successfully.');
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    public function destroy(ProductPlanningTask $productPlanningTask)
    {
        abort_unless(Gate::allows('product_task.delete'), 403);

        $productPlanningTask->delete();

        ActivityLogService::log(
            'product_planning_tasks',
            'delete',
            "Deleted planning task: {$productPlanningTask->title}",
            $productPlanningTask,
            ['title' => $productPlanningTask->title]
        );

        return redirect()->back()->with('success', 'Planning task deleted successfully.');
    }

    // ─── Restore ──────────────────────────────────────────────────────────────

    public function restore(int $id)
    {
        abort_unless(Gate::allows('product_task.delete'), 403);

        // Rule 2: always use onlyTrashed()->findOrFail() for restore
        $task = ProductPlanningTask::onlyTrashed()->findOrFail($id);
        $task->restore();

        ActivityLogService::log(
            'product_planning_tasks',
            'restore',
            "Restored planning task: {$task->title}",
            $task,
            ['title' => $task->title]
        );

        return redirect()->back()->with('success', 'Planning task restored successfully.');
    }
}
