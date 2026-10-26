import React, { useState, useEffect, useRef } from "react";
import { usePage } from "@inertiajs/react";
import { X, Printer, CheckCircle, ShieldCheck, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import JsBarcode from "jsbarcode";
import { CartItemRow } from "./CartItem";

interface SaleResult {
    id: number;
    uuid?: string | null;
    reference_no: string;
    sale_date: string;
    customer_name: string | null;
    payment_method: string | null;
    payment_type?: string | null;
    subtotal: number;
    discount: number;
    tax: number;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    payment_status: "paid" | "partial" | "due";
    items: CartItemRow[];
    note: string | null;
}

interface Props {
    sale: SaleResult;
    businessName: string;
    onClose: () => void;
    onNewSale: () => void;
}

type PaperSize = "80mm" | "58mm";

export default function ReceiptModal({
    sale,
    businessName,
    onClose,
    onNewSale,
}: Props) {
    const { settings, auth } = usePage().props as any;
    const [paperSize, setPaperSize] = useState<PaperSize>("80mm");
    const barcodeRef = useRef<SVGSVGElement | null>(null);

    const storeName = settings?.business_name || businessName || "Master POS";
    const storePhone = settings?.business_phone || "";
    const storeAddress = settings?.business_address || "";
    const storeEmail = settings?.business_email || "";
    const currency = settings?.currency_symbol || "৳";
    const cashierName = auth?.user?.name || "Counter Cashier";

    const trackingUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/track-order?q=${encodeURIComponent(sale.reference_no)}`
            : `/track-order?q=${encodeURIComponent(sale.reference_no)}`;

    // Render Barcode via JsBarcode
    useEffect(() => {
        if (barcodeRef.current && sale.reference_no) {
            try {
                JsBarcode(barcodeRef.current, sale.reference_no, {
                    format: "CODE128",
                    width: paperSize === "58mm" ? 1.2 : 1.5,
                    height: paperSize === "58mm" ? 34 : 44,
                    displayValue: true,
                    fontSize: paperSize === "58mm" ? 10 : 12,
                    font: "monospace",
                    margin: 0,
                    textMargin: 2,
                });
            } catch (err) {
                console.error("Barcode rendering error:", err);
            }
        }
    }, [sale.reference_no, paperSize]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
            {/* Dynamic Print CSS for 80mm / 58mm Thermal Printers */}
            <style>
                {`
                @media print {
                    @page {
                        size: ${paperSize === "58mm" ? "58mm auto" : "80mm auto"};
                        margin: 1.5mm;
                    }
                    html, body {
                        width: ${paperSize === "58mm" ? "56mm" : "78mm"} !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #thermal-receipt-printable, #thermal-receipt-printable * {
                        visibility: visible !important;
                    }
                    #thermal-receipt-printable {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        box-shadow: none !important;
                        border: none !important;
                        font-family: 'Courier New', Courier, monospace !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
                `}
            </style>

            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors">
                {/* ── Modal Header ── */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 bg-slate-50/70 dark:bg-slate-900/70">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={18} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                                Sale Completed
                            </h2>
                            <p className="text-xs text-slate-400 font-mono">
                                #{sale.reference_no}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Paper size switcher toggle */}
                        <div className="inline-flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 text-xs font-medium">
                            <button
                                type="button"
                                onClick={() => setPaperSize("80mm")}
                                className={`px-2.5 py-1 rounded-md transition-all ${
                                    paperSize === "80mm"
                                        ? "bg-white dark:bg-slate-750 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                }`}
                            >
                                80mm
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaperSize("58mm")}
                                className={`px-2.5 py-1 rounded-md transition-all ${
                                    paperSize === "58mm"
                                        ? "bg-white dark:bg-slate-750 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                }`}
                            >
                                58mm
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ── Receipt Viewport ── */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-100/60 dark:bg-slate-950/50 flex justify-center">
                    {/* Thermal Paper Container */}
                    <div
                        id="thermal-receipt-printable"
                        className={`bg-white text-black p-4 sm:p-5 shadow-md border border-slate-200/80 font-mono transition-all duration-200 ${
                            paperSize === "58mm"
                                ? "w-[260px] text-[11px] leading-tight"
                                : "w-[340px] text-xs leading-normal"
                        }`}
                    >
                        {/* Store Header */}
                        <div className="text-center pb-2 border-b-2 border-dashed border-black/80">
                            <h1 className="text-base font-black tracking-tight uppercase">
                                {storeName}
                            </h1>
                            {storeAddress && (
                                <p className="text-[10px] mt-0.5 text-gray-700">
                                    {storeAddress}
                                </p>
                            )}
                            {storePhone && (
                                <p className="text-[10px] text-gray-700">
                                    Phone: {storePhone}
                                </p>
                            )}
                            {storeEmail && (
                                <p className="text-[10px] text-gray-700">
                                    {storeEmail}
                                </p>
                            )}
                            <p className="text-[9px] uppercase tracking-wider font-bold mt-1 text-gray-600">
                                *** POS SALES RECEIPT ({paperSize}) ***
                            </p>
                        </div>

                        {/* Metadata Details */}
                        <div className="py-2 border-b border-dashed border-black/70 space-y-1 text-[11px]">
                            <div className="flex justify-between">
                                <span className="font-semibold">Receipt #:</span>
                                <span className="font-bold">{sale.reference_no}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Date:</span>
                                <span>{sale.sale_date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Cashier:</span>
                                <span>{cashierName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Customer:</span>
                                <span className="font-medium truncate max-w-[150px]">
                                    {sale.customer_name || "Walk-in Customer"}
                                </span>
                            </div>
                            {sale.payment_method && (
                                <div className="flex justify-between">
                                    <span className="font-semibold">Pay Method:</span>
                                    <span>{sale.payment_method}</span>
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="py-2 border-b-2 border-dashed border-black/80">
                            <div className="flex justify-between text-[11px] font-bold border-b border-black pb-1 mb-1">
                                <span>ITEM</span>
                                <span>QTY x PRICE</span>
                                <span className="text-right">TOTAL</span>
                            </div>

                            <div className="space-y-1.5 divide-y divide-dotted divide-gray-300">
                                {sale.items.map((item, idx) => {
                                    const lineTotal =
                                        item.quantity * item.unit_price - (item.discount || 0);
                                    return (
                                        <div key={idx} className="pt-1">
                                            <div className="font-bold truncate">
                                                {item.name}
                                                {item.variant_label ? ` (${item.variant_label})` : ""}
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-gray-700">
                                                <span>
                                                    {item.quantity} × {currency}{item.unit_price.toFixed(2)}
                                                    {item.discount > 0 && ` (-${currency}${item.discount.toFixed(2)})`}
                                                </span>
                                                <span className="font-bold text-black">
                                                    {currency}{lineTotal.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Totals Breakdown */}
                        <div className="py-2 border-b-2 border-dashed border-black/80 space-y-1 text-[11px]">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>{currency}{sale.subtotal.toFixed(2)}</span>
                            </div>
                            {sale.discount > 0 && (
                                <div className="flex justify-between">
                                    <span>Discount:</span>
                                    <span>-{currency}{sale.discount.toFixed(2)}</span>
                                </div>
                            )}
                            {sale.tax > 0 && (
                                <div className="flex justify-between">
                                    <span>Tax / VAT:</span>
                                    <span>+{currency}{sale.tax.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-black border-t border-black pt-1 my-1">
                                <span>GRAND TOTAL:</span>
                                <span>{currency}{sale.grand_total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                                <span>Paid Amount:</span>
                                <span>{currency}{sale.paid_amount.toFixed(2)}</span>
                            </div>
                            {sale.due_amount > 0 && (
                                <div className="flex justify-between font-bold text-black">
                                    <span>Due Remaining:</span>
                                    <span>{currency}{sale.due_amount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-1 text-[10px]">
                                <span className="font-semibold">Payment Status:</span>
                                <span className="uppercase font-black px-1 border border-black">
                                    {sale.payment_status}
                                </span>
                            </div>
                        </div>

                        {/* Note */}
                        {sale.note && (
                            <div className="py-1.5 border-b border-dashed border-black/70 text-[10px]">
                                <span className="font-bold">Note: </span>
                                <span>{sale.note}</span>
                            </div>
                        )}

                        {/* Barcode & QR Code Section */}
                        <div className="py-2.5 text-center flex flex-col items-center justify-center border-b border-dashed border-black/70 gap-2">
                            {/* Barcode */}
                            <div className="flex flex-col items-center">
                                <svg ref={barcodeRef} className="max-w-full" />
                            </div>

                            {/* QR Code */}
                            <div className="flex flex-col items-center gap-1 pt-1">
                                <div className="p-1 bg-white border border-gray-300">
                                    <QRCodeSVG
                                        value={trackingUrl}
                                        size={paperSize === "58mm" ? 64 : 80}
                                        level="M"
                                        includeMargin={false}
                                    />
                                </div>
                                <span className="text-[9px] text-gray-600 flex items-center gap-1">
                                    <QrCode size={10} /> Scan to track or verify order
                                </span>
                            </div>

                            {sale.uuid && (
                                <div className="text-[9px] text-gray-500 font-mono truncate max-w-full flex items-center gap-0.5 justify-center">
                                    <ShieldCheck size={9} className="text-gray-700" />
                                    <span>UUID: {sale.uuid}</span>
                                </div>
                            )}
                        </div>

                        {/* Receipt Footer */}
                        <div className="pt-2 text-center text-[10px] space-y-0.5">
                            <p className="font-bold">Thank You For Your Business!</p>
                            <p className="text-[9px] text-gray-600">
                                Goods once sold can be exchanged within 7 days with this receipt.
                            </p>
                            <p className="text-[8px] text-gray-500 mt-1">
                                Powered by MasterPOS • {new Date().getFullYear()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Modal Footer ── */}
                <div className="flex items-center justify-between gap-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-5 py-3.5">
                    <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                        Paper Mode: <strong className="text-slate-700 dark:text-slate-200">{paperSize}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 transition-colors shadow-sm"
                        >
                            <Printer size={15} className="text-indigo-600 dark:text-indigo-400" />
                            Print Thermal Receipt
                        </button>
                        <button
                            type="button"
                            onClick={onNewSale}
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-5 py-2 text-xs font-semibold text-white transition-colors shadow-md shadow-indigo-600/20"
                        >
                            Start New Sale
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

