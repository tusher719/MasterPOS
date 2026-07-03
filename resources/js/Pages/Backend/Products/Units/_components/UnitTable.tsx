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
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Short Code
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
                    {units.length === 0 && (
                        <tr>
                            <td
                                colSpan={6}
                                className="py-10 text-center text-sm text-gray-400"
                            >
                                No units found.
                            </td>
                        </tr>
                    )}
                    {units.map((unit, i) => (
                        <tr key={unit.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-500">
                                {i + 1}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                {unit.name}
                            </td>
                            <td className="px-4 py-3">
                                <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-600">
                                    {unit.short_code}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                                {unit.product_count}
                            </td>
                            <td className="px-4 py-3">
                                <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                        unit.is_active
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {unit.is_active ? "Active" : "Inactive"}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        onClick={() => onEdit(unit)}
                                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
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
                                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
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
