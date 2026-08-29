<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\LoginHistory;
use Inertia\Inertia;

class LoginHistoryController extends Controller
{
    public function index()
    {
        $histories = LoginHistory::with('user:id,name,email,last_seen_at')
            ->latest('logged_in_at')
            ->paginate(15);

        return Inertia::render('Backend/LoginHistories/Index', [
            'histories' => $histories,
        ]);
    }
}
