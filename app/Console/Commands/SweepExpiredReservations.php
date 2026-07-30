<?php

namespace App\Console\Commands;

use App\Services\StockReservationService;
use Illuminate\Console\Command;

class SweepExpiredReservations extends Command
{
    protected $signature = 'reservations:sweep-expired
                            {--dry-run : Report how many would expire without actually expiring them}';

    protected $description = 'Mark expired stock reservations as expired and free up reserved stock.';

    public function __construct(private readonly StockReservationService $reservationService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        if ($this->option('dry-run')) {
            return $this->runDry();
        }

        $this->line('Sweeping expired stock reservations...');

        $count = $this->reservationService->sweepExpired();

        if ($count === 0) {
            $this->info('No expired reservations found.');
        } else {
            $this->info("Expired {$count} reservation(s) successfully.");
        }

        return self::SUCCESS;
    }

    // ------------------------------------------------------------------ //
    // Private
    // ------------------------------------------------------------------ //

    private function runDry(): int
    {
        $count = \App\Models\StockReservation::expired()->count();

        $this->line("[dry-run] {$count} reservation(s) would be marked expired.");

        return self::SUCCESS;
    }
}
