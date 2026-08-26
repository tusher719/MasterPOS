<?php
// app/Http/Controllers/Backend/UserPreferenceController.php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\UserPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserPreferenceController extends Controller
{
    /**
     * Get current user's preferences.
     * Used for initial load if needed separately.
     */
    public function show(): JsonResponse
    {
        $pref = UserPreference::findOrCreateForUser(Auth::id());

        return response()->json([
            'theme' => $pref->getTheme(),
            'ui'    => $pref->getUi(),
        ]);
    }

    /**
     * Update theme_json for current user.
     * Called from ThemeTab via axios.put()
     */
    public function updateTheme(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'primary_color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'sidebar_color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'font_size'     => ['sometimes', 'in:small,medium,large,xl'],
            'font_family'   => ['sometimes', 'in:inter,roboto,poppins,nunito,dm_sans,plus_jakarta,outfit,lato,open_sans,system'],
            'mode'          => ['sometimes', 'in:light,dark,system'],
            'border_radius' => ['sometimes', 'in:none,small,medium,large'],
            'preset'        => ['sometimes', 'string', 'max:50'],
        ]);

        $pref = UserPreference::findOrCreateForUser(Auth::id());

        // Merge with existing — never overwrite unrelated keys
        $current = $pref->theme_json ?? [];
        $pref->theme_json = array_merge($current, $validated);
        $pref->save();

        return response()->json([
            'success' => true,
            'theme'   => $pref->getTheme(),
            'message' => 'Theme preferences saved successfully.',
        ]);
    }

    /**
     * Update ui_json for current user.
     * Called from ThemeTab or sidebar collapse toggle.
     */
    public function updateUi(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sidebar_collapsed' => ['sometimes', 'boolean'],
            'sidebar_width'     => ['sometimes', 'in:compact,normal,wide'],
            'density'           => ['sometimes', 'in:compact,comfortable,spacious'],
            'card_style'        => ['sometimes', 'in:flat,bordered,elevated'],
            'sidebar_behavior'  => ['sometimes', 'in:fixed,collapsible,hover'],
            'reduce_motion'     => ['sometimes', 'boolean'],
        ]);

        $pref = UserPreference::findOrCreateForUser(Auth::id());

        // Merge with existing
        $current = $pref->ui_json ?? [];
        $pref->ui_json = array_merge($current, $validated);
        $pref->save();

        return response()->json([
            'success' => true,
            'ui'      => $pref->getUi(),
            'message' => 'UI preferences saved successfully.',
        ]);
    }

    /**
     * Reset theme to defaults.
     */
    public function resetTheme(): JsonResponse
    {
        $pref = UserPreference::findOrCreateForUser(Auth::id());
        $pref->theme_json = UserPreference::DEFAULT_THEME;
        $pref->save();

        return response()->json([
            'success' => true,
            'theme'   => $pref->getTheme(),
            'message' => 'Theme reset to default.',
        ]);
    }

    /**
     * Reset UI to defaults.
     */
    public function resetUi(): JsonResponse
    {
        $pref = UserPreference::findOrCreateForUser(Auth::id());
        $pref->ui_json = UserPreference::DEFAULT_UI;
        $pref->save();

        return response()->json([
            'success' => true,
            'ui'      => $pref->getUi(),
            'message' => 'UI preferences reset to default.',
        ]);
    }
}
