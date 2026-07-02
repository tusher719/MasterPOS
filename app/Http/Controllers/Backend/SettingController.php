<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\UpdateSettingRequest;
use App\Http\Requests\Backend\UploadLogoRequest;
use App\Models\BusinessSetting;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        abort_unless(optional(Auth::user())->can('settings.view'), 403);

        return Inertia::render('Backend/Settings/Index', [
            'settings' => BusinessSetting::getAllGrouped(),
        ]);
    }

    public function update(UpdateSettingRequest $request): RedirectResponse
    {
        $group = $request->input('group');
        $data  = $request->except(['group', '_token', '_method']);

        BusinessSetting::setMany($data, $group);

        ActivityLogService::log(
            'settings',
            'updated',
            'Business settings updated',
            null,
            ['group' => $group, 'data' => $data]
        );

        return back()->with('success', ucfirst($group) . ' settings updated successfully.');
    }

    public function uploadLogo(UploadLogoRequest $request): RedirectResponse
    {
        // Remove old logo if exists
        $oldLogo = BusinessSetting::get('business_logo');
        if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
            Storage::disk('public')->delete($oldLogo);
        }

        $path = $request->file('logo')->store('logos', 'public');

        BusinessSetting::set('business_logo', $path, 'business');

        ActivityLogService::log(
            'settings',
            'updated',
            'Business logo updated',
            null,
            ['key' => 'business_logo']
        );

        return back()->with('success', 'Business logo updated successfully.');
    }
}
