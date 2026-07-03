import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState, type ComponentProps } from "react";
import { toast } from "sonner";
import CategoryTable from "./_components/CategoryTable";
import CategoryModal from "./_components/CategoryModal";

type Category = ComponentProps<typeof CategoryTable>["categories"][number];

interface Parent {
    id: number;
    name: string;
}

interface Props {
    categories: Category[];
    parents: Parent[];
}

export default function CategoriesIndex({ categories, parents }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);

    const openCreate = () => {
        setEditing(null);
        setModalOpen(true);
    };
    const openEdit = (cat: Category) => {
        setEditing(cat);
        setModalOpen(true);
    };
    const closeModal = () => {
        setEditing(null);
        setModalOpen(false);
    };

    const handleDelete = (cat: Category) => {
        import("@/lib/confirm").then(({ confirmAction }) => {
            confirmAction({
                title: "Delete Category?",
                text: `"${cat.name}" will be permanently removed.`,
                confirmButtonText: "Yes, delete",
            }).then((ok) => {
                if (!ok) return;
                router.delete(
                    route("backend.product-categories.destroy", cat.id),
                    {
                        onSuccess: () => toast.success("Category deleted."),
                        onError: () =>
                            toast.error("Cannot delete this category."),
                    },
                );
            });
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Product Categories" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Product Categories
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage your product categories and sub-categories
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        + Add Category
                    </button>
                </div>

                {/* Table */}
                <CategoryTable
                    categories={categories}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                />
            </div>

            {/* Modal */}
            <CategoryModal
                open={modalOpen}
                editing={editing as any}
                parents={parents}
                onClose={closeModal}
            />
        </AuthenticatedLayout>
    );
}
