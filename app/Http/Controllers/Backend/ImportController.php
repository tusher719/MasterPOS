<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Imports\CategoryImport;
use App\Imports\CustomerImport;
use App\Imports\ExpenseCategoryImport;
use App\Imports\PaymentMethodImport;
use App\Imports\ProductImport;
use App\Imports\SupplierImport;
use App\Imports\UnitImport;
use App\Exports\CategoryExport;
use App\Exports\CustomerExport;
use App\Exports\ExpenseCategoryExport;
use App\Exports\PaymentMethodExport;
use App\Exports\ProductExport;
use App\Exports\SupplierExport;
use App\Exports\UnitExport;
use App\Models\ImportLog;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Excel as MaatwebsiteExcel;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ImportController extends Controller
{
    // ── Permission map ────────────────────────────────────────────────────────

    private const MODULE_PERMISSIONS = [
        'products'           => 'product.create',
        'categories'         => 'product.create',
        'units'              => 'product.create',
        'customers'          => 'customer.create',
        'suppliers'          => 'supplier.create',
        'expense_categories' => 'expense.create',
        'payment_methods'    => 'settings.edit',
    ];

    private const IMPORTABLE = [
        'products', 'categories', 'units',
        'customers', 'suppliers',
        'expense_categories', 'payment_methods',
    ];

    private const EXPORTABLE = [
        'products', 'categories', 'units',
        'customers', 'suppliers',
        'expense_categories', 'payment_methods',
    ];

    private const TEMPLATE_HEADINGS = [
        'products'           => ['name', 'sku', 'barcode', 'category', 'unit', 'cost_price', 'sale_price', 'stock_qty', 'low_stock_threshold', 'min_sale_qty', 'is_taxable', 'is_featured', 'is_active', 'description'],
        'categories'         => ['name', 'parent_category', 'is_active'],
        'units'              => ['name', 'abbreviation', 'is_active'],
        'customers'          => ['name', 'email', 'phone', 'address', 'city', 'country', 'opening_balance', 'is_active'],
        'suppliers'          => ['name', 'company', 'email', 'phone', 'address', 'city', 'country', 'opening_balance', 'is_active'],
        'expense_categories' => ['name', 'color', 'is_active'],
        'payment_methods'    => ['name', 'type', 'charge_enabled', 'charge_type', 'charge_value', 'charge_label', 'sort_order', 'is_active'],
    ];

    // ── Hub page ──────────────────────────────────────────────────────────────

    public function index(): Response
    {
        $isAdmin    = Auth::user() && Auth::user()->role === 'Admin';
        $userId     = Auth::id();

        $recentLogs = ImportLog::with('importedBy')
            ->forUser($userId, $isAdmin)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn($log) => $this->formatLog($log));

        $can = [];
        foreach (self::MODULE_PERMISSIONS as $module => $permission) {
            $can[$module] = [
                'import' => in_array($module, self::IMPORTABLE, true) && Gate::allows($permission),
                'export' => in_array($module, self::EXPORTABLE, true) && Gate::allows($permission),
            ];
        }

        return Inertia::render('Backend/Import/Index', [
            'recentLogs' => $recentLogs,
            'can'        => $can,
        ]);
    }

    // ── History page ──────────────────────────────────────────────────────────

    public function history(Request $request): Response
    {
        $isAdmin = Auth::user() && Auth::user()->role === 'Admin';
        $userId  = Auth::id();

        $type   = $request->input('type', 'import'); // 'import' or 'export'
        $module = $request->input('module');

        $logs = ImportLog::with('importedBy')
            ->where('type', $type)
            ->forUser($userId, $isAdmin)
            ->when($module, fn($q) => $q->where('module', $module))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn($log) => $this->formatLog($log, withRowResults: false));

        return Inertia::render('Backend/Import/History', [
            'logs'    => $logs,
            'filters' => ['type' => $type, 'module' => $module],
            'modules' => ImportLog::MODULE_LABELS,
        ]);
    }

    // ── History detail (single log with row_results) ──────────────────────────

    public function historyShow(ImportLog $importLog): JsonResponse
    {
        $isAdmin = Auth::user() && Auth::user()->role === 'Admin';
        $userId  = Auth::id();

        // Staff can only see their own logs
        if (!$isAdmin && $importLog->imported_by !== $userId) {
            abort(403);
        }

        return response()->json([
            'log'        => $this->formatLog($importLog, withRowResults: true),
            'row_results' => $importLog->row_results ?? [],
        ]);
    }

    // ── Dry-run ───────────────────────────────────────────────────────────────

    public function dryRun(Request $request): JsonResponse
    {
        $request->validate([
            'module' => ['required', 'string', 'in:' . implode(',', self::IMPORTABLE)],
            'file'   => ['required', 'file', 'max:5120'],
        ]);

        $module = $request->input('module');
        $this->authorizeModule($module);

        $importer = $this->makeImporter($module, isDryRun: true);

        try {
            Excel::import($importer, $request->file('file'));
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not parse the file. Please check the format and try again.',
                'error'   => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'results' => $importer->getResults(),
            'summary' => $importer->getSummary(),
        ]);
    }

    // ── Commit ────────────────────────────────────────────────────────────────

    public function commit(Request $request): JsonResponse
    {
        $request->validate([
            'module' => ['required', 'string', 'in:' . implode(',', self::IMPORTABLE)],
            'file'   => ['required', 'file', 'max:5120'],
        ]);

        $module = $request->input('module');
        $this->authorizeModule($module);

        $importer = $this->makeImporter($module, isDryRun: false);

        try {
            Excel::import($importer, $request->file('file'));
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Import failed. Please try again.',
                'error'   => $e->getMessage(),
            ], 422);
        }

        $summary       = $importer->getSummary();
        $results       = $importer->getResults();
        $importedCount = $summary['success'] + $summary['warnings'];
        $file          = $request->file('file');
        $filename      = $file->getClientOriginalName();
        $fileSize      = $file->getSize(); // bytes

        $status = match (true) {
            $importedCount === 0    => 'failed',
            $summary['errors'] > 0  => 'partial',
            default                 => 'completed',
        };

        ImportLog::create([
            'module'        => $module,
            'type'          => 'import',
            'format'        => pathinfo($filename, PATHINFO_EXTENSION),
            'filename'      => $filename,
            'total_rows'    => $summary['total'],
            'imported_rows' => $importedCount,
            'skipped_rows'  => $summary['errors'],
            'failed_rows'   => 0,
            'row_results'   => $results, // stored as JSON for history preview
            'status'        => $status,
            'imported_by'   => Auth::id(),
        ]);

        ActivityLogService::log(
            'import',
            'commit',
            "Imported {$importedCount} rows into {$module} (skipped: {$summary['errors']})",
            null,
            ['module' => $module, 'filename' => $filename, 'file_size' => $fileSize, 'summary' => $summary]
        );

        return response()->json([
            'success' => true,
            'message' => "Import complete — {$importedCount} rows imported, {$summary['errors']} skipped.",
            'summary' => $summary,
        ]);
    }

    // ── Export ────────────────────────────────────────────────────────────────

    public function export(Request $request): mixed
    {
        $request->validate([
            'module' => ['required', 'string', 'in:' . implode(',', self::EXPORTABLE)],
            'format' => ['required', 'string', 'in:xlsx,csv'],
        ]);

        $module   = $request->input('module');
        $format   = $request->input('format');
        $this->authorizeModule($module);

        $filename = $module . '_export_' . now()->format('Ymd_His') . '.' . $format;
        $exporter = $this->makeExporter($module, $request);

        // Get row count for logging
        $rowCount = $exporter->collection()->count();

        // Log export
        ImportLog::create([
            'module'        => $module,
            'type'          => 'export',
            'format'        => $format,
            'filename'      => $filename,
            'total_rows'    => $rowCount,
            'imported_rows' => $rowCount,
            'skipped_rows'  => 0,
            'failed_rows'   => 0,
            'row_results'   => null,
            'status'        => 'completed',
            'imported_by'   => Auth::id(),
        ]);

        ActivityLogService::log(
            'export',
            'download',
            "Exported {$rowCount} rows from {$module} as {$format}",
            null,
            ['module' => $module, 'format' => $format, 'filename' => $filename, 'rows' => $rowCount]
        );

        if ($format === 'csv') {
            return Excel::download($exporter, $filename, MaatwebsiteExcel::CSV);
        }

        return Excel::download($exporter, $filename);
    }

    // ── Template download ─────────────────────────────────────────────────────

    public function template(Request $request): mixed
    {
        $request->validate([
            'module' => ['required', 'string', 'in:' . implode(',', self::IMPORTABLE)],
        ]);

        $module   = $request->input('module');
        $headings = self::TEMPLATE_HEADINGS[$module] ?? [];
        $filename = $module . '_template.xlsx';

        $templateExport = new class($headings) implements
            FromCollection,
            WithHeadings,
            WithStyles,
            ShouldAutoSize
        {
            public function __construct(private array $headings) {}

            public function collection(): Collection
            {
                return collect([array_fill(0, count($this->headings), '')]);
            }

            public function headings(): array { return $this->headings; }

            public function styles(Worksheet $sheet): array
            {
                return [
                    1 => [
                        'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                        'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '4F46E5']],
                    ],
                ];
            }
        };

        return Excel::download($templateExport, $filename);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function formatLog(ImportLog $log, bool $withRowResults = false): array
    {
        $ext      = $log->format ?? pathinfo($log->filename, PATHINFO_EXTENSION);
        $fileIcon = match (strtolower($ext)) {
            'xlsx', 'xls' => 'excel',
            'csv'         => 'csv',
            'pdf'         => 'pdf',
            default       => 'file',
        };

        $data = [
            'id'            => $log->id,
            'module'        => $log->module,
            'module_label'  => $log->module_label,
            'type'          => $log->type,
            'format'        => strtoupper($ext),
            'file_icon'     => $fileIcon,
            'filename'      => $log->filename,
            'total_rows'    => $log->total_rows,
            'imported_rows' => $log->imported_rows,
            'skipped_rows'  => $log->skipped_rows,
            'failed_rows'   => $log->failed_rows,
            'status'        => $log->status,
            'success_rate'  => $log->success_rate,
            'imported_by'   => $log->importedBy?->name ?? '—',
            'created_at'    => $log->created_at->format('d M Y, h:i A'),
            'created_at_human' => $log->created_at->diffForHumans(),
        ];

        if ($withRowResults) {
            $data['row_results'] = $log->row_results ?? [];
        }

        return $data;
    }

    private function authorizeModule(string $module): void
    {
        $permission = self::MODULE_PERMISSIONS[$module] ?? null;
        abort_unless($permission && Gate::allows($permission), 403);
    }

    private function makeImporter(string $module, bool $isDryRun): object
    {
        return match ($module) {
            'products'           => new ProductImport($isDryRun),
            'categories'         => new CategoryImport($isDryRun),
            'units'              => new UnitImport($isDryRun),
            'customers'          => new CustomerImport($isDryRun),
            'suppliers'          => new SupplierImport($isDryRun),
            'expense_categories' => new ExpenseCategoryImport($isDryRun),
            'payment_methods'    => new PaymentMethodImport($isDryRun),
        };
    }

    private function makeExporter(string $module, Request $request): object
    {
        return match ($module) {
            'products'           => new ProductExport(
                                        $request->input('search'),
                                        $request->input('category'),
                                        $request->input('status'),
                                    ),
            'categories'         => new CategoryExport(),
            'units'              => new UnitExport(),
            'customers'          => new CustomerExport(
                                        $request->input('search'),
                                        $request->input('status'),
                                    ),
            'suppliers'          => new SupplierExport(
                                        $request->input('search'),
                                        $request->input('status'),
                                    ),
            'expense_categories' => new ExpenseCategoryExport(),
            'payment_methods'    => new PaymentMethodExport(),
        };
    }
}
