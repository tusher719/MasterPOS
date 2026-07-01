import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Modal from "@/Components/shared/Modal";
import { Head, router, useForm } from "@inertiajs/react";
import { RoleItem, PermissionGroups } from "@/types/role";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Search, Check } from "lucide-react";
import { confirmAction } from "@/lib/confirm";

export default function Index({
    roles,
    permissionGroups,
}: {
    roles: RoleItem[];
    permissionGroups: PermissionGroups;
}) {
    const [activeRoleId, setActiveRoleId] = useState<number | null>(
        roles[0]?.id ?? null,
    );
    const activeRole = roles.find((r) => r.id === activeRoleId) ?? null;

    const [search, setSearch] = useState("");
    const filteredRoles = useMemo(
        () =>
            roles.filter((r) =>
                r.name.toLowerCase().includes(search.toLowerCase()),
            ),
        [roles, search],
    );

    const [showCreate, setShowCreate] = useState(false);
    const [checked, setChecked] = useState<string[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
    });

    useEffect(() => {
        if (activeRole) setChecked(activeRole.permissions.map((p) => p.name));
    }, [activeRole]);

    const originalPermissions =
        activeRole?.permissions.map((p) => p.name) ?? [];
    const hasChanges =
        checked.length !== originalPermissions.length ||
        checked.some((p) => !originalPermissions.includes(p));
    const changedCount = useMemo(() => {
        const added = checked.filter(
            (p) => !originalPermissions.includes(p),
        ).length;
        const removed = originalPermissions.filter(
            (p) => !checked.includes(p),
        ).length;
        return added + removed;
    }, [checked, originalPermissions]);

    const submitCreate = (e: FormEvent) => {
        e.preventDefault();
        post(route("backend.roles.store"), {
            onSuccess: () => {
                setShowCreate(false);
                reset();
            },
        });
    };

    const toggle = (name: string) => {
        setChecked((prev) =>
            prev.includes(name)
                ? prev.filter((p) => p !== name)
                : [...prev, name],
        );
    };

    const savePermissions = () => {
        if (!activeRole) return;
        router.put(
            route("backend.roles.permissions", activeRole.id),
            { permissions: checked },
            { preserveScroll: true },
        );
    };

    const handleDelete = async (role: RoleItem) => {
        const confirmed = await confirmAction({
            title: "Delete this role?",
            text: `Role "${role.name}" will be permanently deleted.`,
            confirmButtonText: "Yes, delete",
            icon: "error",
        });

        if (confirmed) {
            router.delete(route("backend.roles.destroy", role.id), {
                onSuccess: () => setActiveRoleId(roles[0]?.id ?? null),
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Roles & Permissions" />

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Roles & Permissions
                        </h1>
                        <p className="text-sm text-gray-500">
                            Create roles and assign action-based permissions
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        <Plus size={16} /> Add Role
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-5">
                    {/* Role list */}
                    <div className="col-span-1 rounded-lg border border-gray-200 bg-white p-3">
                        <div className="relative mb-3">
                            <Search
                                size={14}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search roles..."
                                className="w-full rounded-md border-gray-300 py-2 pl-9 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
                            {filteredRoles.length === 0 && (
                                <p className="px-2 py-3 text-center text-xs text-gray-400">
                                    No roles found
                                </p>
                            )}
                            {filteredRoles.map((role) => {
                                const isActive = activeRole?.id === role.id;
                                return (
                                    <div
                                        key={role.id}
                                        onClick={() => setActiveRoleId(role.id)}
                                        className={`group flex cursor-pointer items-center justify-between rounded-md border-l-2 px-3 py-2.5 text-sm transition-colors ${
                                            isActive
                                                ? "border-indigo-600 bg-indigo-50 font-medium text-indigo-700"
                                                : "border-transparent text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        <span className="truncate">
                                            {role.name}
                                        </span>
                                        {role.name !== "Admin" && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(role);
                                                }}
                                                className="text-red-500 opacity-40 hover:text-red-500 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Permission matrix */}
                    <div className="col-span-3 rounded-lg border border-gray-200 bg-white p-5">
                        {activeRole ? (
                            <>
                                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-800">
                                            {activeRole.name} — Permissions
                                        </h2>
                                        {hasChanges && (
                                            <p className="mt-0.5 text-xs text-amber-600">
                                                {changedCount} change
                                                {changedCount > 1
                                                    ? "s"
                                                    : ""}{" "}
                                                unsaved
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={savePermissions}
                                        disabled={!hasChanges}
                                        className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                                    >
                                        <Save size={14} /> Save
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {Object.entries(permissionGroups).map(
                                        ([group, perms]) => (
                                            <div key={group}>
                                                <h3 className="mb-2 text-sm font-semibold capitalize text-gray-600">
                                                    {group}
                                                </h3>
                                                <div className="flex flex-wrap gap-3">
                                                    {perms.map((p) => {
                                                        const isChecked =
                                                            checked.includes(
                                                                p.name,
                                                            );
                                                        return (
                                                            <label
                                                                key={p.id}
                                                                className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        isChecked
                                                                    }
                                                                    onChange={() =>
                                                                        toggle(
                                                                            p.name,
                                                                        )
                                                                    }
                                                                    className="rounded border-gray-300 text-indigo-600"
                                                                />
                                                                {
                                                                    p.name.split(
                                                                        ".",
                                                                    )[1]
                                                                }
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gray-400">
                                No role selected
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                show={showCreate}
                onClose={() => setShowCreate(false)}
                title="Add Role"
            >
                <form onSubmit={submitCreate} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Role Name
                        </label>
                        <input
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="mt-1 w-full rounded-md border-gray-300 text-sm"
                            placeholder="e.g. Cashier"
                        />
                        {errors.name && (
                            <p className="text-xs text-red-600">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowCreate(false)}
                            className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
