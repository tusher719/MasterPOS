import { Link, router } from "@inertiajs/react";
import { AlertTriangle, Eye, ExternalLink, Pencil, Power, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import TableActionDropdown, { TableActionItem } from "@/Components/Common/TableActionDropdown";
import ProductPreviewModal from "./ProductPreviewModal";
import type { Product } from "../Index";

interface Props {
    products: Product[];
    onDelete: (product: Product) => void;
}

export default function ProductTable({ products, onDelete }: Props) {
    const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const handleOpenPreview = (product: Product) => {
        setPreviewProduct(product);
        setIsPreviewOpen(true);
    };

    const handleToggleStatus = (product: Product) => {
        router.patch(
            route("backend.products.toggle-status", product.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Product "${product.name}" ${!product.is_active ? "activated" : "deactivated"} successfully.`
                    );
                },
                onError: () => toast.error("Failed to update product status."),
            }
        );
    };

    const getRowActions = (product: Product): TableActionItem[] => [
        {
            label: "Preview Details",
            icon: <Eye size={15} />,
            onClick: () => handleOpenPreview(product),
        },
        {
            label: "Edit Product",
            icon: <Pencil size={15} />,
            href: route("backend.products.edit", product.id),
        },
        ...(product.is_active
            ? [
                  {
                      label: "View on Store",
                      icon: <ExternalLink size={15} />,
                      onClick: () =>
                          window.open(
                              route("public.products.show", product.slug),
                              "_blank"
                          ),
                  },
              ]
            : []),
        {
            label: product.is_active ? "Deactivate" : "Activate",
            icon: <Power size={15} />,
            onClick: () => handleToggleStatus(product),
            dividerBefore: true,
        },
        {
            label: "Delete",
            icon: <Trash2 size={15} />,
            onClick: () => onDelete(product),
            danger: true,
            dividerBefore: true,
        },
    ];

    return (
        <>
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/40 border-b border-border">
                            <tr>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">
                                    #
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Product
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Category
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Price
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Stock
                                </th>
                                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Status
                                </th>
                                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {products.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-14 text-center text-sm text-muted-foreground"
                                    >
                                        No products found. Add your first product.
                                    </td>
                                </tr>
                            )}
                            {products.map((product, i) => (
                                <tr
                                    key={product.id}
                                    className="hover:bg-muted/40 transition-colors group"
                                >
                                    {/* # */}
                                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                                        {i + 1}
                                    </td>

                                    {/* Product */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {/* Thumbnail */}
                                            {product.primary_image ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenPreview(product)}
                                                    className="focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg shrink-0"
                                                >
                                                    <img
                                                        src={product.primary_image}
                                                        alt={product.name}
                                                        className="h-10 w-10 rounded-lg object-cover border border-border shrink-0 hover:opacity-90 transition-opacity"
                                                    />
                                                </button>
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                                                    <span className="text-[10px] font-semibold text-muted-foreground">
                                                        IMG
                                                    </span>
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenPreview(product)}
                                                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate text-left focus:outline-none"
                                                    >
                                                        {product.name}
                                                    </button>
                                                    {product.is_featured && (
                                                        <Star
                                                            size={12}
                                                            className="text-amber-400 fill-amber-400 shrink-0"
                                                        />
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                                    SKU: {product.sku}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Category */}
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {product.category_name ? (
                                            <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground border border-border/50">
                                                {product.category_name}
                                            </span>
                                        ) : (
                                            <span className="italic text-muted-foreground/50 text-xs">
                                                Uncategorized
                                            </span>
                                        )}
                                    </td>

                                    {/* Price */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-baseline gap-1 text-sm font-semibold text-foreground">
                                            <span className="text-xs text-muted-foreground font-normal">৳</span>
                                            <span>{Number(product.sale_price).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Cost: ৳{Number(product.cost_price).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                                className={`text-sm font-semibold ${
                                                    product.is_low_stock
                                                        ? "text-amber-500"
                                                        : "text-foreground"
                                                }`}
                                            >
                                                {Number(product.stock_qty).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                            </span>
                                            {product.unit_short_code && (
                                                <span className="text-xs text-muted-foreground font-normal">
                                                    {product.unit_short_code}
                                                </span>
                                            )}
                                        </div>
                                        {product.is_low_stock && (
                                            <p className="text-[11px] font-medium text-amber-500 mt-0.5">
                                                Low stock
                                            </p>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                                                product.is_active
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                    : "bg-muted text-muted-foreground border-border"
                                            }`}
                                        >
                                            {product.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>

                                    {/* Actions with TableActionDropdown */}
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenPreview(product)}
                                                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                                title="Quick preview"
                                            >
                                                <Eye size={15} />
                                            </button>
                                            <Link
                                                href={route("backend.products.edit", product.id)}
                                                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                                title="Edit product"
                                            >
                                                <Pencil size={15} />
                                            </Link>
                                            <TableActionDropdown
                                                actions={getRowActions(product)}
                                                triggerSize="sm"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProductPreviewModal
                opened={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                product={previewProduct}
            />
        </>
    );
}
