import { Link } from "@inertiajs/react";
import {
    AlertTriangle,
    Edit2,
    ImageOff,
    Package,
    Star,
    Trash2,
} from "lucide-react";
import type { Product } from "../Index";

interface Props {
    products: Product[];
    onDelete: (product: Product) => void;
}

function StockBadge({ product }: { product: Product }) {
    const qty = Number(product.stock_qty);
    const threshold = Number(product.low_stock_threshold);

    if (qty <= 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                Out of stock
            </span>
        );
    }
    if (product.is_low_stock) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <AlertTriangle className="h-2.5 w-2.5" />
                Low stock
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            In stock
        </span>
    );
}

function ProductCard({
    product,
    onDelete,
}: {
    product: Product;
    onDelete: (p: Product) => void;
}) {
    return (
        <div
            className={`group relative flex flex-col rounded-xl border bg-card transition-shadow hover:shadow-md ${
                !product.is_active
                    ? "border-border opacity-60"
                    : "border-border"
            }`}
        >
            {/* Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-muted">
                {product.primary_image ? (
                    <img
                        src={product.primary_image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <ImageOff className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                )}

                {/* Top badges */}
                <div className="absolute left-2 top-2 flex flex-col gap-1">
                    {!product.is_active && (
                        <span className="rounded-full bg-gray-800/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                            Inactive
                        </span>
                    )}
                    {product.is_featured && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                            <Star className="h-2.5 w-2.5 fill-white" />
                            Featured
                        </span>
                    )}
                    {product.has_variants && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-600/90 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                            <Package className="h-2.5 w-2.5" />
                            {product.variants.length} var.
                        </span>
                    )}
                </div>

                {/* Action buttons — appear on hover */}
                <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <Link
                        href={route("backend.products.edit", product.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm hover:bg-white hover:text-indigo-600 transition-colors"
                        title="Edit product"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                    </Link>
                    <button
                        onClick={() => onDelete(product)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm hover:bg-white hover:text-red-500 transition-colors"
                        title="Delete product"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-2 p-3">
                {/* Name */}
                <div className="min-w-0">
                    <Link
                        href={route("backend.products.edit", product.id)}
                        className="block truncate text-sm font-semibold text-foreground hover:text-indigo-600 transition-colors leading-snug"
                        title={product.name}
                    >
                        {product.name}
                    </Link>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        SKU: {product.sku}
                    </p>
                </div>

                {/* Category */}
                {product.category_name && (
                    <span className="inline-block w-fit rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground truncate max-w-full">
                        {product.category_name}
                    </span>
                )}

                {/* Price row */}
                <div className="flex items-center justify-between mt-auto pt-1 border-t border-border">
                    <span className="text-sm font-bold text-foreground">
                        ৳{Number(product.sale_price).toLocaleString("en-BD")}
                    </span>
                    <StockBadge product={product} />
                </div>

                {/* Stock qty */}
                <p className="text-[11px] text-muted-foreground -mt-1">
                    Qty:{" "}
                    <span className="font-medium text-foreground">
                        {Number(product.stock_qty).toLocaleString("en-BD")}
                    </span>
                    {product.unit_short_code && (
                        <span className="ml-0.5">
                            {product.unit_short_code}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}

export default function ProductGrid({ products, onDelete }: Props) {
    if (products.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card py-20 text-center">
                <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-foreground">
                    No products found
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Add your first product to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
