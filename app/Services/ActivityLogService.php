<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    public static function log(string $module, string $action, ?string $description = null, $subject = null, ?array $properties = null): void
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'module' => $module,
            'action' => $action,
            'subject_type' => is_object($subject) ? get_class($subject) : null,
            'subject_id' => is_object($subject) ? ($subject->id ?? null) : (is_numeric($subject) ? (int) $subject : null),
            'description' => $description,
            'properties' => $properties,
        ]);
    }
}
