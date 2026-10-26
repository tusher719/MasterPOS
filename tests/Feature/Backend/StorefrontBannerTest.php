<?php

namespace Tests\Feature\Backend;

use App\Models\Coupon;
use App\Models\StorefrontBanner;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StorefrontBannerTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $unauthorizedUser;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Staff']);

        $this->admin = User::factory()->create(['status' => 'active']);
        $this->admin->assignRole('Admin');

        $this->unauthorizedUser = User::factory()->create(['status' => 'active']);
    }

    public function test_admin_can_view_storefront_banners_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('backend.storefront.banners.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backend/StorefrontBanners/Index')
            ->has('banners')
            ->has('stats')
            ->has('coupons')
        );
    }

    public function test_admin_can_create_banner_with_uploaded_image_and_uuid(): void
    {
        $file = UploadedFile::fake()->image('summer-sale.jpg', 1600, 500);

        $payload = [
            'title'       => 'Summer Mega Clearance',
            'subtitle'    => 'Up to 50% discount on all trending items',
            'badge_text'  => '50% OFF',
            'image'       => $file,
            'link_url'    => '/products?featured=1',
            'button_text' => 'Shop Clearance',
            'coupon_code' => 'SUMMER50',
            'placement'   => 'hero_slider',
            'bg_color'    => '#111827',
            'sort_order'  => 0,
            'is_active'   => true,
            'starts_at'   => now()->subDay()->toDateTimeString(),
            'expires_at'  => now()->addDays(15)->toDateTimeString(),
        ];

        $response = $this->actingAs($this->admin)->post(route('backend.storefront.banners.store'), $payload);
        $response->assertRedirect(route('backend.storefront.banners.index'));

        $banner = StorefrontBanner::where('title', 'Summer Mega Clearance')->first();
        $this->assertNotNull($banner);
        $this->assertNotNull($banner->uuid);
        $this->assertEquals('hero_slider', $banner->placement);
        $this->assertEquals('SUMMER50', $banner->coupon_code);
        $this->assertTrue((bool) $banner->is_active);

        Storage::disk('public')->assertExists($banner->image_path);
    }

    public function test_admin_can_update_banner_details_and_replace_image(): void
    {
        $oldFile = UploadedFile::fake()->image('old-banner.jpg', 1200, 400);
        $oldPath = $oldFile->store('banners', 'public');

        $banner = StorefrontBanner::create([
            'title'      => 'Original Banner Title',
            'image_path' => $oldPath,
            'placement'  => 'hero_slider',
            'is_active'  => true,
        ]);

        $newFile = UploadedFile::fake()->image('new-banner.jpg', 1600, 500);

        $payload = [
            'title'       => 'Updated Banner Title',
            'subtitle'    => 'New promo subtitle',
            'image'       => $newFile,
            'placement'   => 'promo_strip',
            'button_text' => 'Explore Now',
            'is_active'   => true,
        ];

        $response = $this->actingAs($this->admin)->put(route('backend.storefront.banners.update', $banner), $payload);
        $response->assertRedirect(route('backend.storefront.banners.index'));

        $banner->refresh();
        $this->assertEquals('Updated Banner Title', $banner->title);
        $this->assertEquals('promo_strip', $banner->placement);

        // Old file deleted, new file exists
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($banner->image_path);
    }

    public function test_admin_can_toggle_banner_status(): void
    {
        $banner = StorefrontBanner::create([
            'title'      => 'Toggle Banner',
            'image_path' => 'banners/placeholder.jpg',
            'placement'  => 'hero_slider',
            'is_active'  => true,
        ]);

        $response = $this->actingAs($this->admin)->patch(route('backend.storefront.banners.toggle-status', $banner));
        $response->assertRedirect();

        $banner->refresh();
        $this->assertFalse((bool) $banner->is_active);

        // Toggle back
        $this->actingAs($this->admin)->patch(route('backend.storefront.banners.toggle-status', $banner));
        $banner->refresh();
        $this->assertTrue((bool) $banner->is_active);
    }

    public function test_admin_can_reorder_banners(): void
    {
        $banner1 = StorefrontBanner::create([
            'title'      => 'Banner 1',
            'image_path' => 'banners/b1.jpg',
            'placement'  => 'hero_slider',
            'sort_order' => 1,
            'is_active'  => true,
        ]);

        $banner2 = StorefrontBanner::create([
            'title'      => 'Banner 2',
            'image_path' => 'banners/b2.jpg',
            'placement'  => 'hero_slider',
            'sort_order' => 2,
            'is_active'  => true,
        ]);

        $payload = [
            'orders' => [
                ['id' => $banner1->id, 'sort_order' => 10],
                ['id' => $banner2->id, 'sort_order' => 1],
            ],
        ];

        $response = $this->actingAs($this->admin)->post(route('backend.storefront.banners.reorder'), $payload);
        $response->assertRedirect();

        $banner1->refresh();
        $banner2->refresh();

        $this->assertEquals(10, $banner1->sort_order);
        $this->assertEquals(1, $banner2->sort_order);
    }

    public function test_admin_can_soft_delete_and_restore_banner(): void
    {
        $banner = StorefrontBanner::create([
            'title'      => 'Banner to Delete',
            'image_path' => 'banners/del.jpg',
            'placement'  => 'hero_slider',
            'is_active'  => true,
        ]);

        // Soft delete
        $delResponse = $this->actingAs($this->admin)->delete(route('backend.storefront.banners.destroy', $banner));
        $delResponse->assertRedirect(route('backend.storefront.banners.index'));
        $this->assertSoftDeleted('storefront_banners', ['id' => $banner->id]);

        // Restore
        $resResponse = $this->actingAs($this->admin)->post(route('backend.storefront.banners.restore', $banner->id));
        $resResponse->assertRedirect(route('backend.storefront.banners.index'));
        $this->assertNotSoftDeleted('storefront_banners', ['id' => $banner->id]);
    }

    public function test_unauthorized_user_cannot_create_or_delete_banner(): void
    {
        $payload = [
            'title'     => 'Unauthorized Banner',
            'placement' => 'hero_slider',
            'image'     => UploadedFile::fake()->image('unauth.jpg'),
        ];

        $response = $this->actingAs($this->unauthorizedUser)->post(route('backend.storefront.banners.store'), $payload);
        $response->assertStatus(403);
    }

    public function test_public_home_loads_active_banners_and_excludes_expired_or_inactive(): void
    {
        // 1. Active Hero Banner (should appear in heroBanners)
        $activeHero = StorefrontBanner::create([
            'title'      => 'Active Hero Promo',
            'image_path' => 'banners/active-hero.jpg',
            'placement'  => 'hero_slider',
            'is_active'  => true,
            'starts_at'  => now()->subDays(2),
            'expires_at' => now()->addDays(5),
            'sort_order' => 0,
        ]);

        // 2. Inactive Hero Banner (should NOT appear)
        StorefrontBanner::create([
            'title'      => 'Inactive Hero Promo',
            'image_path' => 'banners/inactive-hero.jpg',
            'placement'  => 'hero_slider',
            'is_active'  => false,
        ]);

        // 3. Expired Hero Banner (should NOT appear)
        StorefrontBanner::create([
            'title'      => 'Expired Hero Promo',
            'image_path' => 'banners/expired-hero.jpg',
            'placement'  => 'hero_slider',
            'is_active'  => true,
            'expires_at' => now()->subDay(),
        ]);

        // 4. Active Promo Strip Banner (should appear in promoBanners)
        $activePromo = StorefrontBanner::create([
            'title'      => 'Active Strip Promo',
            'image_path' => 'banners/active-strip.jpg',
            'placement'  => 'promo_strip',
            'is_active'  => true,
            'sort_order' => 0,
        ]);

        $response = $this->get(route('public.home'));
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page
            ->component('Public/Home')
            ->has('heroBanners', 1)
            ->where('heroBanners.0.id', $activeHero->id)
            ->has('promoBanners', 1)
            ->where('promoBanners.0.id', $activePromo->id)
        );
    }
}
