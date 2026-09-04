<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\UpdateSettingRequest;
use App\Http\Requests\Backend\UploadLogoRequest;
use App\Models\BusinessSetting;
use App\Services\ActivityLogService;
use App\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        abort_unless(optional(Auth::user())->can('settings.view'), 403);

        // Cache থেকে flat map নাও, তারপর group করো
        $flat = SettingsService::all();

        // Group by করার জন্য DB একবার হিট করতে হবে (group column দরকার)
        // তাই এটা আগের মতোই রাখো — index page এ performance critical না
        $settings = BusinessSetting::getAllGrouped();

        if (!empty($settings['business']['business_logo'])) {
            $settings['business']['business_logo_url'] =
                request()->getSchemeAndHttpHost() . request()->getBaseUrl()
                . '/storage/' . $settings['business']['business_logo'];
        }

        // Also expose logo_image_path as a full URL for the settings page preview.
        if (!empty($settings['business']['logo_image_path'])) {
            $settings['business']['logo_image_path_url'] =
                request()->getSchemeAndHttpHost() . request()->getBaseUrl()
                . '/storage/' . $settings['business']['logo_image_path'];
        }

        return Inertia::render('Backend/Settings/Index', [
            'pageSettings' => $settings,
            'can'          => [
                'editLegalPages' => Gate::allows('legal_page.edit'),
            ],
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
        // Remove old logo file from disk if exists
        $oldLogo = BusinessSetting::get('logo_image_path')
            ?? BusinessSetting::get('business_logo');

        if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
            Storage::disk('public')->delete($oldLogo);
        }

        $path = $request->file('logo')->store('logos', 'public');

        // Save to both keys — logo_image_path is the new canonical key,
        // business_logo kept for backward compat (PDF templates still read it).
        BusinessSetting::set('business_logo', $path, 'business');
        BusinessSetting::set('logo_image_path', $path, 'business');

        // Force cache clear so NavbarLogo picks up the new path immediately
        SettingsService::invalidate();

        ActivityLogService::log(
            'settings',
            'updated',
            'Business logo updated',
            null,
            ['key' => 'logo_image_path']
        );

        return back()->with('success', 'Business logo updated successfully.');
    }
}
