import { Pencil, Trash2 } from "lucide-react";

interface Unit {
    id: number;
    name: string;
    short_code: string;
    is_active: boolean;
    product_count: number;
}

interface Props {
    units: Unit[];
    onEdit: (unit: Unit) => void;
    onDelete: (unit: Unit) => void;
}

export default function UnitTable({ units, onEdit, onDelete }: Props) {
    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40 border-b border-border">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Short Code
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
                    {units.length === 0 && (
                        <tr>
                            <td
                                colSpan={6}
                                className="py-10 text-center text-sm text-muted-foreground"
                            >
                                No units found.
                            </td>
                        </tr>
                    )}
                    {units.map((unit, i) => (
                        <tr key={unit.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                {i + 1}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-foreground">
                                {unit.name}
                            </td>
                            <td className="px-4 py-3">
                                <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium text-foreground border border-border">
                                    {unit.short_code}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                {unit.product_count}
                            </td>
                            <td className="px-4 py-3">
                                <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${
                                        unit.is_active
                                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                            : "bg-muted text-muted-foreground border-border"
                                    }`}
                                >
                                    {unit.is_active ? "Active" : "Inactive"}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => onEdit(unit)}
                                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(unit)}
                                        disabled={unit.product_count > 0}
                                        title={
                                            unit.product_count > 0
                                                ? "In use by products"
                                                : "Delete"
                                        }
                                        className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-colors"
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
