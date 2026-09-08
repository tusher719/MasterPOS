// resources/js/Pages/Backend/Settings/_components/StaffRolesTab.tsx

import { router } from "@inertiajs/react";
import { Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Role {
    id: number;
    name: string;
}

interface Props {
    roles: Role[];
    currentDefaultRoleId: number | null;
}

export default function StaffRolesTab({ roles, currentDefaultRoleId }: Props) {
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(
        currentDefaultRoleId,
    );
    const [saving, setSaving] = useState(false);

    function handleSave() {
        setSaving(true);
        router.post(
            route("backend.settings.update"),
            {
                group: "staff",
                default_registration_role_id: selectedRoleId ?? "",
            },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success("Default role saved successfully."),
                onError: () => toast.error("Failed to save default role."),
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <div className="space-y-6">
            {/* Section header */}
            <div>
                <h3 className="text-sm font-semibold text-foreground">
                    Staff Registration Defaults
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    When Admin creates a new staff account, this role is
                    pre-selected in the form. Admin can still change it per-user
                    before saving.
                </p>
            </div>

            {/* Default role selector */}
            <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Users size={18} />
                    </div>

                    <div className="flex-1 space-y-3">
                        <div>
                            <label className="text-sm font-medium text-foreground">
                                Default Role
                            </label>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Role auto-selected when creating a new staff
                                account. Set to "None" to require manual
                                selection every time.
                            </p>
                        </div>

                        <select
                            value={selectedRoleId ?? ""}
                            onChange={(e) =>
                                setSelectedRoleId(
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-72"
                        >
                            <option value="">
                                — No default (manual selection required) —
                            </option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.name}
                                </option>
                            ))}
                        </select>

                        {/* Current state hint */}
                        {selectedRoleId ? (
                            <p className="text-xs text-indigo-600">
                                New staff accounts will be pre-assigned:{" "}
                                <span className="font-medium">
                                    {
                                        roles.find(
                                            (r) => r.id === selectedRoleId,
                                        )?.name
                                    }
                                </span>
                            </p>
                        ) : (
                            <p className="text-xs text-amber-600">
                                No default set — Admin must select a role
                                manually for every new account.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
