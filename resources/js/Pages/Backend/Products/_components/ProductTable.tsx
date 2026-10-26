import { Link } from "@inertiajs/react";
import { Pencil, Trash2, AlertTriangle, Star } from "lucide-react";

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode: string | null;
    category_name: string | null;
    unit_short_code: string | null;
    cost_price: string;
    sale_price: string;
    stock_qty: string;
    low_stock_threshold: string;
    is_low_stock: boolean;
    is_featured: boolean;
    is_active: boolean;
    primary_image: string | null;
}

interface Props {
    products: Product[];
    onDelete: (product: Product) => void;
}

export default function ProductTable({ products, onDelete }: Props) {
    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40 border-b border-border">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {products.length === 0 && (
                        <tr>
                            <td
                                colSpan={7}
                                className="py-12 text-center text-sm text-muted-foreground"
                            >
                                No products found. Add your first product.
                            </td>
                        </tr>
                    )}
                    {products.map((product, i) => (
                        <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                            {/* # */}
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                {i + 1}
                            </td>

                            {/* Product */}
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    {/* Thumbnail */}
                                    {product.primary_image ? (
                                        <img
                                            src={product.primary_image}
                                            alt={product.name}
                                            className="h-10 w-10 rounded-md object-cover border border-border shrink-0"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0 border border-border">
                                            <span className="text-xs text-muted-foreground">
                                                IMG
                                            </span>
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {product.name}
                                            </p>
                                            {product.is_featured && (
                                                <Star
                                                    size={12}
                                                    className="text-amber-400 fill-amber-400 shrink-0"
                                                />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {product.sku}
                                        </p>
                                    </div>
                                </div>
                            </td>

                            {/* Category */}
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                {product.category_name ?? (
                                    <span className="italic text-muted-foreground/60">
                                        —
                                    </span>
                                )}
                            </td>

                            {/* Price */}
                            <td className="px-4 py-3">
                                <p className="text-sm font-medium text-foreground">
                                    ৳{Number(product.sale_price).toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Cost: ৳
                                    {Number(product.cost_price).toFixed(2)}
                                </p>
                            </td>

                            {/* Stock */}
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                    {product.is_low_stock && (
                                        <AlertTriangle
                                            size={13}
                                            className="text-amber-500 shrink-0"
                                        />
                                    )}
                                    <span
                                        className={`text-sm font-medium ${
                                            product.is_low_stock
                                                ? "text-amber-500"
                                                : "text-foreground"
                                        }`}
                                    >
                                        {Number(product.stock_qty).toFixed(2)}
                                    </span>
                                    {product.unit_short_code && (
                                        <span className="text-xs text-muted-foreground">
                                            {product.unit_short_code}
                                        </span>
                                    )}
                                </div>
                                {product.is_low_stock && (
                                    <p className="text-xs text-amber-500 mt-0.5">
                                        Low stock
                                    </p>
                                )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                                <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${
                                        product.is_active
                                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                            : "bg-muted text-muted-foreground border-border"
                                    }`}
                                >
                                    {product.is_active ? "Active" : "Inactive"}
                                </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <Link
                                        href={route(
                                            "backend.products.edit",
                                            product.id,
                                        )}
                                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        <Pencil size={15} />
                                    </Link>
                                    <button
                                        onClick={() => onDelete(product)}
                                        className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
