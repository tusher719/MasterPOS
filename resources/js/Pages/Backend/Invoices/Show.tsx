import { Head } from "@inertiajs/react";
import { Printer, Download, ArrowLeft } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

interface BusinessSetting {
    business_name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    logo: string | null;
    currency_symbol: string;
    currency_position: "before" | "after";
    decimal_places: number;
}

interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
}

interface Product {
    id: number;
    name: string;
    sku: string | null;
}

interface SaleItem {
    id: number;
    product: Product;
    quantity: number;
    unit_price: string;
    discount: string;
    subtotal: string;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface Sale {
    id: number;
    reference_no: string;
    sale_date: string;
    customer: Customer | null;
    payment_method: PaymentMethod | null;
    items: SaleItem[];
    subtotal: string;
    discount: string;
    tax: string;
    grand_total: string;
    paid_amount: string;
    due_amount: string;
    payment_status: "paid" | "partial" | "due";
    note: string | null;
    deleted_at: string | null;
    created_at: string;
}

interface Props {
    sale: Sale;
    business: BusinessSetting;
    can: { print: boolean };
}

const statusConfig = {
    paid: {
        label: "PAID",
        classes: "bg-green-100 text-green-700 border-green-200",
    },
    partial: {
        label: "PARTIAL",
        classes: "bg-amber-100 text-amber-700 border-amber-200",
    },
    due: { label: "DUE", classes: "bg-red-100 text-red-600 border-red-200" },
};

export default function InvoiceShow({ sale, business, can }: Props) {
    const symbol = business.currency_symbol ?? "৳";
    const decimals = business.decimal_places ?? 2;
    const position = business.currency_position ?? "before";

    const fmt = (value: string) => {
        const formatted = parseFloat(value).toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
        return position === "before"
            ? `${symbol}${formatted}`
            : `${formatted}${symbol}`;
    };

    const handlePrint = () => window.print();

    const status = statusConfig[sale.payment_status];

    return (
        <AuthenticatedLayout>
            <Head title={`Invoice ${sale.reference_no}`} />

            {/* ── Action Bar (hidden on print) ── */}
            <div className="mb-6 flex items-center justify-between print:hidden">
                <a
                    href={route("backend.invoices.index")}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Invoices
                </a>

                <div className="flex items-center gap-2">
                    {can.print && !sale.deleted_at && (
                        <a
                            href={route("backend.invoices.pdf", sale.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </a>
                    )}
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        <Printer className="h-4 w-4" />
                        Print Invoice
                    </button>
                </div>
            </div>

            {/* ── Invoice Card ── */}
            <div
                id="invoice-print-area"
                className="relative mx-auto max-w-3xl overflow-hidden rounded-lg border border-gray-200 bg-white p-8 shadow-sm print:shadow-none print:border-none print:rounded-none print:max-w-full print:p-6"
            >
                {/* ── Watermark Logo (center, transparent) ── */}
                {business.logo && (
                    <img
                        src={`/storage/${business.logo}`}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-auto w-2/3 max-w-sm -translate-x-1/2 -translate-y-1/2 opacity-[0.06] print:opacity-[0.08]"
                    />
                )}

                {/* ── Content (sits above watermark) ── */}
                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-gray-100 pb-6">
                        {/* Business Info */}
                        <div>
                            {business.logo && (
                                <img
                                    src={`/storage/${business.logo}`}
                                    alt="Business Logo"
                                    className="mb-3 h-12 w-auto object-contain"
                                />
                            )}
                            <h2 className="text-xl font-bold text-gray-800">
                                {business.business_name}
                            </h2>
                            {business.address && (
                                <p className="mt-0.5 whitespace-pre-line text-sm text-gray-500">
                                    {business.address}
                                </p>
                            )}
                            {business.phone && (
                                <p className="text-sm text-gray-500">
                                    Tel: {business.phone}
                                </p>
                            )}
                            {business.email && (
                                <p className="text-sm text-gray-500">
                                    {business.email}
                                </p>
                            )}
                        </div>

                        {/* Invoice Meta */}
                        <div className="text-right">
                            <h1 className="text-3xl font-bold tracking-tight text-indigo-600">
                                INVOICE
                            </h1>
                            <p className="mt-1 font-mono text-sm font-semibold text-gray-700">
                                #{sale.reference_no}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                Date:{" "}
                                <span className="font-medium text-gray-700">
                                    {new Date(
                                        sale.sale_date,
                                    ).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </p>
                            {/* Payment Status Badge */}
                            <span
                                className={`mt-2 inline-block rounded-full border px-3 py-0.5 text-xs font-bold tracking-wide ${status.classes}`}
                            >
                                {status.label}
                            </span>
                            {sale.deleted_at && (
                                <span className="ml-2 inline-block rounded-full border border-red-200 bg-red-100 px-3 py-0.5 text-xs font-bold tracking-wide text-red-600">
                                    VOIDED
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="mt-6 grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Bill To
                            </p>
                            {sale.customer ? (
                                <div className="mt-1">
                                    <p className="font-semibold text-gray-800">
                                        {sale.customer.name}
                                    </p>
                                    {sale.customer.phone && (
                                        <p className="text-sm text-gray-500">
                                            {sale.customer.phone}
                                        </p>
                                    )}
                                    {sale.customer.email && (
                                        <p className="text-sm text-gray-500">
                                            {sale.customer.email}
                                        </p>
                                    )}
                                    {sale.customer.address && (
                                        <p className="text-sm text-gray-500">
                                            {sale.customer.address}
                                        </p>
                                    )}
                                    {sale.customer.city && (
                                        <p className="text-sm text-gray-500">
                                            {sale.customer.city}
                                            {sale.customer.country
                                                ? `, ${sale.customer.country}`
                                                : ""}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="mt-1 text-sm italic text-gray-400">
                                    Walk-in Customer
                                </p>
                            )}
                        </div>

                        <div className="text-right">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Payment
                            </p>
                            <p className="mt-1 text-sm text-gray-700">
                                {sale.payment_method
                                    ? sale.payment_method.name
                                    : "—"}
                            </p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mt-8">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="pb-2 text-left font-semibold text-gray-600">
                                        #
                                    </th>
                                    <th className="pb-2 text-left font-semibold text-gray-600">
                                        Item
                                    </th>
                                    <th className="pb-2 text-left font-semibold text-gray-600">
                                        SKU
                                    </th>
                                    <th className="pb-2 text-right font-semibold text-gray-600">
                                        Qty
                                    </th>
                                    <th className="pb-2 text-right font-semibold text-gray-600">
                                        Unit Price
                                    </th>
                                    <th className="pb-2 text-right font-semibold text-gray-600">
                                        Discount
                                    </th>
                                    <th className="pb-2 text-right font-semibold text-gray-600">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sale.items.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="py-3 text-gray-400">
                                            {index + 1}
                                        </td>
                                        <td className="py-3 font-medium text-gray-800">
                                            {item.product.name}
                                        </td>
                                        <td className="py-3 font-mono text-xs text-gray-400">
                                            {item.product.sku ?? "—"}
                                        </td>
                                        <td className="py-3 text-right text-gray-700">
                                            {item.quantity}
                                        </td>
                                        <td className="py-3 text-right text-gray-700">
                                            {fmt(item.unit_price)}
                                        </td>
                                        <td className="py-3 text-right text-gray-500">
                                            {parseFloat(item.discount) > 0
                                                ? fmt(item.discount)
                                                : "—"}
                                        </td>
                                        <td className="py-3 text-right font-medium text-gray-800">
                                            {fmt(item.subtotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="mt-6 flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>{fmt(sale.subtotal)}</span>
                            </div>

                            {parseFloat(sale.discount) > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Discount</span>
                                    <span className="text-red-500">
                                        − {fmt(sale.discount)}
                                    </span>
                                </div>
                            )}

                            {parseFloat(sale.tax) > 0 && (
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Tax</span>
                                    <span>{fmt(sale.tax)}</span>
                                </div>
                            )}

                            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-800">
                                <span>Grand Total</span>
                                <span>{fmt(sale.grand_total)}</span>
                            </div>

                            <div className="flex justify-between text-sm text-green-600">
                                <span>Paid Amount</span>
                                <span>{fmt(sale.paid_amount)}</span>
                            </div>

                            {parseFloat(sale.due_amount) > 0 && (
                                <div className="flex justify-between text-sm font-semibold text-red-500">
                                    <span>Due Amount</span>
                                    <span>{fmt(sale.due_amount)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Note */}
                    {sale.note && (
                        <div className="mt-8 rounded-md bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Note
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                                {sale.note}
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-10 border-t border-gray-100 pt-6 text-center">
                        <p className="text-xs text-gray-400">
                            Thank you for your business! —{" "}
                            {business.business_name}
                        </p>
                        {business.phone && (
                            <p className="mt-0.5 text-xs text-gray-400">
                                Contact: {business.phone}
                                {business.email ? ` · ${business.email}` : ""}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Print CSS ── */}
            <style>{`
                @media print {
                    body > *:not(#app) { display: none; }

                    nav,
                    aside,
                    header,
                    [data-sidebar],
                    .print\\:hidden { display: none !important; }

                    @page {
                        margin: 1cm;
                        size: A4 portrait;
                    }

                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    #invoice-print-area {
                        box-shadow: none !important;
                        border: none !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
