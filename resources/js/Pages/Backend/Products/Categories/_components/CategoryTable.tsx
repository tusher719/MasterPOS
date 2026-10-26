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
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40 border-b border-border">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Image
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Parent
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Products
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
                    {categories.length === 0 && (
                        <tr>
                            <td
                                colSpan={7}
                                className="py-10 text-center text-sm text-muted-foreground"
                            >
                                No categories found.
                            </td>
                        </tr>
                    )}
                    {categories.map((cat, i) => (
                        <tr key={cat.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                {i + 1}
                            </td>
                            <td className="px-4 py-3">
                                {cat.image ? (
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="h-9 w-9 rounded-md object-cover border border-border"
                                    />
                                ) : (
                                    <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                        N/A
                                    </div>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <p className="text-sm font-medium text-foreground">
                                    {cat.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {cat.slug}
                                </p>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                {cat.parent_name ?? (
                                    <span className="text-xs text-muted-foreground/60 italic">
                                        Top level
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                {cat.product_count}
                            </td>
                            <td className="px-4 py-3">
                                <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${
                                        cat.is_active
                                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                            : "bg-muted text-muted-foreground border-border"
                                    }`}
                                >
                                    {cat.is_active ? "Active" : "Inactive"}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => onEdit(cat)}
                                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(cat)}
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
