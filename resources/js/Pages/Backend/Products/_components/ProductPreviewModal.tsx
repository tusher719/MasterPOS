import { Product } from "../Index";
import { X, ExternalLink, Pencil, Barcode as BarcodeIcon, Tag, Boxes, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "@inertiajs/react";
import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface Props {
    product: Product | null;
    isOpen?: boolean;
    opened?: boolean;
    onClose: () => void;
}

export default function ProductPreviewModal({ product, isOpen, opened, onClose }: Props) {
    const isVisible = isOpen ?? opened ?? false;
    const barcodeRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (isVisible && product?.barcode && barcodeRef.current) {
            try {
                JsBarcode(barcodeRef.current, product.barcode, {
                    format: "CODE128",
                    width: 1.5,
                    height: 40,
                    displayValue: true,
                    fontSize: 12,
                    margin: 0,
                });
            } catch {
                // If barcode format is invalid, fail silently
            }
        }
    }, [isVisible, product]);

    if (!isVisible || !product) return null;

    const profit = Number(product.sale_price) - Number(product.cost_price);
    const profitMargin = Number(product.sale_price) > 0 ? (profit / Number(product.sale_price)) * 100 : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-primary/10 p-2 text-primary">
                            <Boxes size={18} />
                        </span>
                        <div>
                            <h3 className="text-base font-bold text-foreground">
                                Product Details & Preview
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                SKU: {product.sku}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Image */}
                        <div className="md:col-span-1 flex flex-col items-center">
                            <div className="w-full aspect-square rounded-xl border border-border bg-muted/40 overflow-hidden flex items-center justify-center">
                                {product.primary_image ? (
                                    <img
                                        src={product.primary_image}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Boxes size={36} />
                                        <span className="text-xs">No image uploaded</span>
                                    </div>
                                )}
                            </div>

                            {/* Barcode SVG */}
                            {product.barcode ? (
                                <div className="mt-4 w-full flex flex-col items-center justify-center rounded-xl border border-border p-3 bg-white">
                                    <svg ref={barcodeRef} className="max-w-full" />
                                </div>
                            ) : (
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <BarcodeIcon size={14} />
                                    <span>No barcode generated</span>
                                </div>
                            )}
                        </div>

                        {/* Specs */}
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-lg font-bold text-foreground">
                                        {product.name}
                                    </h4>
                                    {product.is_featured && (
                                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400">
                                            Featured
                                        </span>
                                    )}
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        product.is_active
                                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400"
                                            : "bg-muted text-muted-foreground"
                                    }`}>
                                        {product.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Category: <span className="font-semibold text-foreground">{product.category_name || "Uncategorized"}</span>
                                    {product.unit_short_code && ` • Unit: ${product.unit_short_code}`}
                                </p>
                            </div>

                            {/* Price / Cost / Margin cards */}
                            <div className="grid grid-cols-3 gap-2.5">
                                <div className="rounded-xl border border-border bg-muted/20 p-2.5">
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Sale Price</p>
                                    <p className="mt-0.5 text-base font-bold text-foreground font-sans">
                                        ৳ {Number(product.sale_price).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border bg-muted/20 p-2.5">
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Cost Price</p>
                                    <p className="mt-0.5 text-base font-bold text-muted-foreground font-sans">
                                        ৳ {Number(product.cost_price).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border bg-muted/20 p-2.5">
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Est. Margin</p>
                                    <p className={`mt-0.5 text-base font-bold font-sans ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                                        {profitMargin.toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            {/* Stock status */}
                            <div className="rounded-xl border border-border p-3.5 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-muted-foreground">Inventory Level:</span>
                                    <span className={`inline-flex items-center gap-1 font-bold ${
                                        product.is_low_stock
                                            ? "text-amber-500"
                                            : "text-emerald-600 dark:text-emerald-400"
                                    }`}>
                                        {product.is_low_stock ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                                        {Number(product.stock_qty).toLocaleString()} {product.unit_short_code || "units"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Low Stock Alert Threshold:</span>
                                    <span>{product.low_stock_threshold || "5"} units</span>
                                </div>
                            </div>

                            {/* Variants preview if exists */}
                            {product.variants && product.variants.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-bold text-foreground">
                                        Product Variants ({product.variants.length})
                                    </p>
                                    <div className="rounded-xl border border-border overflow-hidden">
                                        <table className="w-full text-xs">
                                            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Variant</th>
                                                    <th className="px-3 py-2 text-left">SKU</th>
                                                    <th className="px-3 py-2 text-right">Price</th>
                                                    <th className="px-3 py-2 text-right">Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {product.variants.map((v) => (
                                                    <tr key={v.id}>
                                                        <td className="px-3 py-2 font-medium text-foreground">{v.label}</td>
                                                        <td className="px-3 py-2 text-muted-foreground">{v.sku}</td>
                                                        <td className="px-3 py-2 text-right font-medium">
                                                            ৳ {Number(v.price_override || product.sale_price).toFixed(2)}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-bold text-foreground">
                                                            {v.stock_qty}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border px-6 py-3.5 bg-muted/20">
                    <a
                        href={`/products/${product.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                        <ExternalLink size={14} />
                        View on Storefront
                    </a>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route("backend.products.edit", product.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
                        >
                            <Pencil size={14} />
                            Edit Product
                        </Link>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
