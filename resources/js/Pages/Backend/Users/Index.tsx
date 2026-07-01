import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DataTable from "@/Components/shared/DataTable";
import Modal from "@/Components/shared/Modal";
import { Head, router, useForm } from "@inertiajs/react";
import { PaginatedUsers, User } from "@/types/user";
import { FormEvent, useState } from "react";
import { Plus, Pencil, Archive, Search } from "lucide-react";
import { toast } from "sonner";
import { confirmAction } from "@/lib/confirm";

export default function Index({
    users,
    roles,
    filters,
}: {
    users: PaginatedUsers;
    roles: string[];
    filters: { search?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: "",
            email: "",
            phone: "",
            password: "",
            role: roles[0] ?? "",
            status: "active",
        });

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            route("backend.users.index"),
            { search },
            { preserveState: true },
        );
    };

    const openCreate = () => {
        reset();
        clearErrors();
        setEditingUser(null);
        setShowModal(true);
    };

    const openEdit = (user: User) => {
        clearErrors();
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            phone: user.phone ?? "",
            password: "",
            role: user.roles[0]?.name ?? roles[0] ?? "",
            status: user.status,
        });
        setShowModal(true);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            put(route("backend.users.update", editingUser.id), {
                onSuccess: () => setShowModal(false),
            });
        } else {
            post(route("backend.users.store"), {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const handleDelete = async (user: User) => {
        const confirmed = await confirmAction({
            title: "Archive this user?",
            text: `${user.name} will be archived.`,
            confirmButtonText: "Yes, archive",
        });

        if (confirmed) {
            router.delete(route("backend.users.destroy", user.id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Users" />

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Users
                        </h1>
                        <p className="text-sm text-gray-500">
                            Manage all admin/staff users
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        <Plus size={16} /> Add User
                    </button>
                </div>

                <form onSubmit={handleSearch} className="relative max-w-xs">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name..."
                        className="w-full rounded-lg border-gray-300 py-2 pl-9 text-sm shadow-sm"
                    />
                </form>

                <DataTable<User>
                    columns={[
                        {
                            header: "Name",
                            accessor: (u) => (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                                        {u.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {u.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {u.email}
                                        </p>
                                    </div>
                                </div>
                            ),
                        },
                        { header: "Phone", accessor: (u) => u.phone ?? "-" },
                        {
                            header: "Role",
                            accessor: (u) => (
                                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                                    {u.roles.map((r) => r.name).join(", ") ||
                                        "-"}
                                </span>
                            ),
                        },
                        {
                            header: "Status",
                            accessor: (u) => (
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                        u.status === "active"
                                            ? "bg-green-50 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {u.status}
                                </span>
                            ),
                        },
                        {
                            header: "Actions",
                            accessor: (u) => (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => openEdit(u)}
                                        className="text-indigo-600 hover:text-indigo-800"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(u)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Archive size={16} />
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                    data={users.data}
                    links={users.links}
                />
            </div>

            <Modal
                show={showModal}
                onClose={() => setShowModal(false)}
                title={editingUser ? "Edit User" : "Add User"}
            >
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Name
                        </label>
                        <input
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="mt-1 w-full rounded-md border-gray-300 text-sm"
                        />
                        {errors.name && (
                            <p className="text-xs text-red-600">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            className="mt-1 w-full rounded-md border-gray-300 text-sm"
                        />
                        {errors.email && (
                            <p className="text-xs text-red-600">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Phone
                        </label>
                        <input
                            value={data.phone}
                            onChange={(e) => setData("phone", e.target.value)}
                            className="mt-1 w-full rounded-md border-gray-300 text-sm"
                        />
                        {errors.phone && (
                            <p className="text-xs text-red-600">
                                {errors.phone}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Password{" "}
                            {editingUser && (
                                <span className="text-xs text-gray-400">
                                    (Leave blank to keep unchanged)
                                </span>
                            )}
                        </label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            className="mt-1 w-full rounded-md border-gray-300 text-sm"
                        />
                        {errors.password && (
                            <p className="text-xs text-red-600">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Role
                            </label>
                            <select
                                value={data.role}
                                onChange={(e) =>
                                    setData("role", e.target.value)
                                }
                                className="mt-1 w-full rounded-md border-gray-300 text-sm"
                            >
                                {roles.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Status
                            </label>
                            <select
                                value={data.status}
                                onChange={(e) =>
                                    setData("status", e.target.value)
                                }
                                className="mt-1 w-full rounded-md border-gray-300 text-sm"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {editingUser ? "Update" : "Save"}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
