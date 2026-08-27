<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class LowStockNotification extends Notification
{
    public function __construct(
        protected string $productName,
        protected float  $currentQty,
        protected float  $threshold,
        protected int    $productId
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title'        => 'Low Stock Alert',
            'message'      => "{$this->productName} is running low ({$this->currentQty} remaining, threshold: {$this->threshold})",
            'icon'         => 'package',
            'module'       => 'product',
            'reference_id' => $this->productId,
            'url'          => route('backend.products.edit', $this->productId),
        ];
    }
}
