import { Pencil, Trash2 } from "lucide-react";

interface Category {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    parent_name: string | null;
    image: string | null;
    sort_order: number;
    is_active: boolean;
    product_count: number;
}

interface Props {
    categories: Category[];
    onEdit: (cat: Category) => void;
    onDelete: (cat: Category) => void;
}

export default function CategoryTable({ categories, onEdit, onDelete }: Props) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Image
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Parent
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Products
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
                    {categories.length === 0 && (
                        <tr>
                            <td
                                colSpan={7}
                                className="py-10 text-center text-sm text-gray-400"
                            >
                                No categories found.
                            </td>
                        </tr>
                    )}
                    {categories.map((cat, i) => (
                        <tr key={cat.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-500">
                                {i + 1}
                            </td>
                            <td className="px-4 py-3">
                                {cat.image ? (
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="h-9 w-9 rounded-md object-cover border border-gray-100"
                                    />
                                ) : (
                                    <div className="h-9 w-9 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                                        N/A
                                    </div>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-800">
                                    {cat.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {cat.slug}
                                </p>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                                {cat.parent_name ?? (
                                    <span className="text-xs text-gray-300 italic">
                                        Top level
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                                {cat.product_count}
                            </td>
                            <td className="px-4 py-3">
                                <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                        cat.is_active
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {cat.is_active ? "Active" : "Inactive"}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => onEdit(cat)}
                                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(cat)}
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
