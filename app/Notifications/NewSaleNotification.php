<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class NewSaleNotification extends Notification
{
    public function __construct(
        protected int $saleId,
        protected float $amount,
        protected string $customerName,
        protected int $itemCount
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title'        => 'New Sale Recorded',
            'message'      => "Sale #{$this->saleId} of ৳{$this->amount} from {$this->customerName} ({$this->itemCount} items)",
            'icon'         => 'shopping-cart',
            'module'       => 'sale',
            'reference_id' => $this->saleId,
            'url'          => '/backend/sales/' . $this->saleId,
        ];
    }
}
