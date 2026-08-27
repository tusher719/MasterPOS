<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class NewExpenseNotification extends Notification
{
    public function __construct(
        protected int    $expenseId,
        protected float  $amount,
        protected string $categoryName,
        protected string $note
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title'        => 'New Expense Added',
            'message'      => "৳{$this->amount} expense under {$this->categoryName}" . ($this->note ? " — {$this->note}" : ''),
            'icon'         => 'receipt',
            'module'       => 'expense',
            'reference_id' => $this->expenseId,
            'url'          => route('backend.expenses.show', $this->expenseId),
        ];
    }
}
