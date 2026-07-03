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
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {products.length === 0 && (
                        <tr>
                            <td
                                colSpan={7}
                                className="py-12 text-center text-sm text-gray-400"
                            >
                                No products found. Add your first product.
                            </td>
                        </tr>
                    )}
                    {products.map((product, i) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                            {/* # */}
                            <td className="px-4 py-3 text-sm text-gray-500">
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
                                            className="h-10 w-10 rounded-md object-cover border border-gray-100 shrink-0"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                                            <span className="text-xs text-gray-400">
                                                IMG
                                            </span>
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {product.name}
                                            </p>
                                            {product.is_featured && (
                                                <Star
                                                    size={12}
                                                    className="text-amber-400 fill-amber-400 shrink-0"
                                                />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono">
                                            {product.sku}
                                        </p>
                                    </div>
                                </div>
                            </td>

                            {/* Category */}
                            <td className="px-4 py-3 text-sm text-gray-500">
                                {product.category_name ?? (
                                    <span className="italic text-gray-300">
                                        —
                                    </span>
                                )}
                            </td>

                            {/* Price */}
                            <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-800">
                                    ৳{Number(product.sale_price).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-400">
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
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {Number(product.stock_qty).toFixed(2)}
                                    </span>
                                    {product.unit_short_code && (
                                        <span className="text-xs text-gray-400">
                                            {product.unit_short_code}
                                        </span>
                                    )}
                                </div>
                                {product.is_low_stock && (
                                    <p className="text-xs text-amber-400 mt-0.5">
                                        Low stock
                                    </p>
                                )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                                <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                        product.is_active
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
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
                                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                                    >
                                        <Pencil size={15} />
                                    </Link>
                                    <button
                                        onClick={() => onDelete(product)}
                                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
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
