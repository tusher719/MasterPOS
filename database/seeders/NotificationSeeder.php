<?php

namespace Database\Seeders;

use App\Models\User;
use App\Notifications\LowStockNotification;
use App\Notifications\NewSaleNotification;
use App\Notifications\NewExpenseNotification;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::role('Admin')->first();

        if (!$admin) {
            $this->command->warn('No Admin user found. Skipping NotificationSeeder.');
            return;
        }

        // Low stock alerts
        $admin->notify(new LowStockNotification(
            productName: 'Coca Cola 500ml',
            currentQty: 3.00,
            threshold: 10.00,
            productId: 1
        ));

        $admin->notify(new LowStockNotification(
            productName: 'Lays Classic Chips',
            currentQty: 5.00,
            threshold: 20.00,
            productId: 2
        ));

        // New sale notifications
        $admin->notify(new NewSaleNotification(
            saleId: 1001,
            amount: 1250.00,
            customerName: 'Walk-in Customer',
            itemCount: 4
        ));

        $admin->notify(new NewSaleNotification(
            saleId: 1002,
            amount: 3800.50,
            customerName: 'Rahim Uddin',
            itemCount: 7
        ));

        // New expense notification
        $admin->notify(new NewExpenseNotification(
            expenseId: 1,
            amount: 5000.00,
            categoryName: 'Utilities',
            note: 'Monthly electricity bill'
        ));

        // Mark 2 as already read (simulate mixed state)
        $admin->notifications()->latest()->skip(3)->take(2)->get()->each(
            fn ($n) => $n->markAsRead()
        );

        $this->command->info('NotificationSeeder: 5 notifications created (3 unread, 2 read).');
    }
}
