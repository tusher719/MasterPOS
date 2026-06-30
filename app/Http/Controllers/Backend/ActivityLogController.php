<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index()
    {
        $logs = ActivityLog::with('user:id,name')
            ->when(request('module'), fn($q) => $q->where('module', request('module')))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $modules = ActivityLog::select('module')->distinct()->pluck('module');

        return Inertia::render('Backend/ActivityLogs/Index', [
            'logs' => $logs,
            'modules' => $modules,
            'filters' => request()->only('module'),
        ]);
    }
}
