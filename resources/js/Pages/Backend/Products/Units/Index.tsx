import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import { toast } from "sonner";
import UnitTable from "./_components/UnitTable";
import UnitModal from "./_components/UnitModal";

interface Unit {
    id: number;
    name: string;
    short_code: string;
    is_active: boolean;
    product_count: number;
}

interface Props {
    units: Unit[];
}

export default function UnitsIndex({ units }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Unit | null>(null);

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };
    const openEdit = (unit: Unit) => {
        setEditing(unit);
        setModalOpen(true);
    };
    const closeModal = () => {
        setEditing(null);
        setModalOpen(false);
    };

    const handleDelete = (unit: Unit) => {
        import("@/lib/confirm").then(({ confirmAction }) => {
            confirmAction({
                title: "Delete Unit?",
                text: `"${unit.name} (${unit.short_code})" will be removed.`,
                confirmButtonText: "Yes, delete",
            }).then((ok) => {
                if (!ok) return;
                router.delete(route("backend.units.destroy", unit.id), {
                    onSuccess: () => toast.success("Unit deleted."),
                    onError: () => toast.error("Cannot delete this unit."),
                });
            });
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Units of Measurement" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Units of Measurement
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage units used across products (kg, pcs, ltr…)
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        + Add Unit
                    </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Units", value: units.length },
                        {
                            label: "Active",
                            value: units.filter((u) => u.is_active).length,
                        },
                        {
                            label: "Used in Products",
                            value: units.filter((u) => u.product_count > 0)
                                .length,
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-lg border border-gray-200 bg-white p-4"
                        >
                            <p className="text-xs text-gray-500">
                                {stat.label}
                            </p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <UnitTable
                    units={units}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                />
            </div>

            {/* Modal */}
            <UnitModal
                open={modalOpen}
                editing={editing}
                onClose={closeModal}
            />
        </AuthenticatedLayout>
    );
}
