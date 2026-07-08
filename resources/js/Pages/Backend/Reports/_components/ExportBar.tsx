import { Download, Printer, FileText, FileSpreadsheet } from "lucide-react";

interface Props {
    canExport: boolean;
    reportType: string; // e.g. 'sales', 'profit-loss'
    filters: { from: string; to: string; customer_id?: string | null };
    rowCount: number;
}

export default function ExportBar({
    canExport,
    reportType,
    filters,
    rowCount,
}: Props) {
    function buildExportUrl(fmt: "csv" | "pdf"): string {
        const params = new URLSearchParams({
            from: filters.from,
            to: filters.to,
        });
        if (filters.customer_id) params.set("customer_id", filters.customer_id);
        return (
            route("backend.reports.export", { type: reportType, fmt }) +
            "?" +
            params.toString()
        );
    }

    function handlePrint() {
        window.print();
    }

    return (
        <div
            className="flex items-center justify-between rounded-lg border border-gray-200
                        bg-white px-4 py-3"
        >
            {/* Row count */}
            <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">{rowCount}</span>{" "}
                {rowCount === 1 ? "record" : "records"} found
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
                {/* Print — always visible */}
                <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300
                               px-3 py-1.5 text-sm font-medium text-gray-600
                               hover:bg-gray-50 transition print:hidden"
                >
                    <Printer className="h-4 w-4" />
                    Print
                </button>

                {canExport && (
                    <>
                        {/* CSV */}
                        <a
                            href={buildExportUrl("csv")}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300
                                       px-3 py-1.5 text-sm font-medium text-gray-600
                                       hover:bg-gray-50 transition"
                        >
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            CSV
                        </a>

                        {/* PDF */}
                        <a
                            href={buildExportUrl("pdf")}
                            className="flex items-center gap-1.5 rounded-lg bg-indigo-600
                                       px-3 py-1.5 text-sm font-medium text-white
                                       hover:bg-indigo-700 transition"
                        >
                            <FileText className="h-4 w-4" />
                            PDF
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}
