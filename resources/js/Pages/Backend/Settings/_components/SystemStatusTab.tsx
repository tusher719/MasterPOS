import { AlertTriangle, Clock, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    settings: {
        system?: Record<string, string | null | undefined>;
    };
}

export default function SystemStatusTab({ settings }: Props) {
    const s = settings.system ?? {};

    const [maintenanceEnabled, setMaintenanceEnabled] = useState(
        s.maintenance_mode_enabled === "true",
    );
    const [maintenanceMessage, setMaintenanceMessage] = useState(
        s.maintenance_message ??
            "We are currently performing scheduled maintenance. We will be back shortly.",
    );
    const [comingSoonEnabled, setComingSoonEnabled] = useState(
        s.coming_soon_mode_enabled === "true",
    );
    const [comingSoonMessage, setComingSoonMessage] = useState(
        s.coming_soon_message ?? "Our website is coming soon. Stay tuned!",
    );
    const [processing, setProcessing] = useState(false);

    const save = () => {
        setProcessing(true);
        window.axios
            .post(route("backend.settings.update"), {
                group: "system",
                maintenance_mode_enabled: maintenanceEnabled ? "true" : "false",
                maintenance_message: maintenanceMessage,
                coming_soon_mode_enabled: comingSoonEnabled ? "true" : "false",
                coming_soon_message: comingSoonMessage,
            })
            .then(() => {
                toast.success("System status settings saved.");
                // Reload so SettingsService cache refreshes
                setTimeout(() => window.location.reload(), 600);
            })
            .catch(() => toast.error("Failed to save settings."))
            .finally(() => setProcessing(false));
    };

    return (
        <div className="space-y-5">
            {/* ── Maintenance Mode ─────────────────────────────────────── */}
            <div className="rounded-lg border border-border bg-card p-5">
                <div className="mb-5 border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        <h2 className="text-base font-semibold text-foreground">
                            Maintenance Mode
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        When enabled, all backend and POS routes show a
                        maintenance page. Only Super Admin can still access the
                        system.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Toggle */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                Enable Maintenance Mode
                            </p>
                            <p className="text-xs text-muted-foreground">
                                All staff/customers see the maintenance page
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setMaintenanceEnabled((v) => !v)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                maintenanceEnabled
                                    ? "bg-amber-500"
                                    : "bg-gray-200"
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                    maintenanceEnabled
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                }`}
                            />
                        </button>
                    </div>

                    {/* Active warning */}
                    {maintenanceEnabled && (
                        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                            <AlertTriangle
                                size={14}
                                className="mt-0.5 shrink-0 text-amber-600"
                            />
                            <p className="text-sm text-amber-700">
                                <strong>Warning:</strong> Maintenance mode is
                                ON. Staff (non-Admin) will be redirected to the
                                maintenance page immediately.
                            </p>
                        </div>
                    )}

                    {/* Message */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Maintenance Message
                        </label>
                        <textarea
                            value={maintenanceMessage}
                            onChange={(e) =>
                                setMaintenanceMessage(e.target.value)
                            }
                            rows={3}
                            className="w-full rounded-md border-border bg-input text-sm text-foreground shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Message shown on the maintenance page..."
                        />
                    </div>
                </div>
            </div>

            {/* ── Coming Soon Mode ─────────────────────────────────────── */}
            <div className="rounded-lg border border-border bg-card p-5">
                <div className="mb-5 border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                        <Clock size={18} className="text-indigo-500" />
                        <h2 className="text-base font-semibold text-foreground">
                            Coming Soon Mode
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        When enabled, the public website (storefront) shows a
                        "Coming Soon" page. Backend and POS are unaffected.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Toggle */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                Enable Coming Soon Mode
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Public website visitors see the coming soon page
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setComingSoonEnabled((v) => !v)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                comingSoonEnabled
                                    ? "bg-indigo-600"
                                    : "bg-gray-200"
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                    comingSoonEnabled
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                }`}
                            />
                        </button>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            Coming Soon Message
                        </label>
                        <textarea
                            value={comingSoonMessage}
                            onChange={(e) =>
                                setComingSoonMessage(e.target.value)
                            }
                            rows={3}
                            className="w-full rounded-md border-border bg-input text-sm text-foreground shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Message shown on the coming soon page..."
                        />
                    </div>
                </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
                <button
                    type="button"
                    disabled={processing}
                    onClick={save}
                    className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    <Save size={14} />
                    {processing ? "Saving..." : "Save System Status"}
                </button>
            </div>
        </div>
    );
}
