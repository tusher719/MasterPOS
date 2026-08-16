import { Clock, User } from "lucide-react";
import { ORDER_STATUS_OPTIONS } from "../Index";

export interface StatusHistoryEntry {
    id: number;
    status: string;
    note: string | null;
    changed_by: { id: number; name: string } | null;
    created_at: string;
}

interface Props {
    history: StatusHistoryEntry[];
}

function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

function StatusBadge({ status }: { status: string }) {
    const option = ORDER_STATUS_OPTIONS.find((o) => o.value === status);

    if (option) {
        return (
            <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${option.classes}`}
            >
                {option.label}
            </span>
        );
    }

    // Fallback for any unknown status value
    return (
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
            {status}
        </span>
    );
}

export default function StatusHistoryTimeline({ history }: Props) {
    if (history.length === 0) {
        return (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
                No status history recorded yet.
            </div>
        );
    }

    return (
        <div className="px-5 py-4">
            <ol className="relative border-l border-gray-200">
                {history.map((entry, index) => {
                    const isFirst = index === 0;

                    return (
                        <li key={entry.id} className="mb-6 ml-5 last:mb-0">
                            {/* Timeline dot */}
                            <span
                                className={`absolute -left-[9px] flex h-4 w-4 items-center
                                    justify-center rounded-full ring-4 ring-white
                                    ${isFirst ? "bg-indigo-600" : "bg-gray-300"}`}
                            />

                            {/* Entry card */}
                            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                {/* Top row — badge + timestamp */}
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <StatusBadge status={entry.status} />
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <Clock size={11} />
                                        {formatDateTime(entry.created_at)}
                                    </span>
                                </div>

                                {/* Note */}
                                {entry.note && (
                                    <p className="mt-2 text-sm text-gray-600">
                                        {entry.note}
                                    </p>
                                )}

                                {/* Changed by */}
                                {entry.changed_by && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                                        <User size={11} />
                                        <span>{entry.changed_by.name}</span>
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
