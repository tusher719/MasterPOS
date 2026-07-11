import { confirmAction } from "@/lib/confirm";
import type { ItemPayment, ItemSummary } from "@/types/profit-distribution";
import { AlertTriangle, Loader2, RotateCcw, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
    distributionId: number;
    itemId: number;
    onClose: () => void;
    onPaymentChanged: () => void;
}

const STATUS_BADGE: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    partial: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    deferred: "bg-purple-100 text-purple-700",
    reinvested: "bg-indigo-100 text-indigo-700",
    cancelled: "bg-red-100 text-red-700",
    reopened: "bg-yellow-100 text-yellow-700",
};

export default function PaymentHistoryModal({
    distributionId,
    itemId,
    onClose,
    onPaymentChanged,
}: Props) {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState<ItemPayment[]>([]);
    const [summary, setSummary] = useState<ItemSummary | null>(null);
    const [acting, setActing] = useState<number | null>(null);

    async function fetchPayments() {
        setLoading(true);
        try {
            const res = await fetch(
                route("backend.profit-distributions.items.payments.index", {
                    pd: distributionId,
                    item: itemId,
                }),
                {
                    headers: { Accept: "application/json" },
                },
            );
            const data = await res.json();
            setPayments(data.payments ?? []);
            setSummary(data.item_summary ?? null);
        } catch {
            toast.error("Failed to load payment history.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPayments();
    }, [distributionId, itemId]);

    async function handleCancel(payment: ItemPayment) {
        const ok = await confirmAction({
            title: "Cancel Payment?",
            text: `This will cancel the ${payment.payment_status_label} of ৳${payment.amount.toFixed(2)} and restore the investor's pending balance.`,
            confirmButtonText: "Yes, Cancel It",
        });

        if (!ok) return;

        setActing(payment.id);

        try {
            const res = await fetch(
                route("backend.profit-distributions.items.payments.cancel", {
                    pd: distributionId,
                    item: itemId,
                    payment: payment.id,
                }),
                {
                    method: "DELETE",
                    headers: {
                        Accept: "application/json",
                        "X-CSRF-TOKEN":
                            (
                                document.querySelector(
                                    'meta[name="csrf-token"]',
                                ) as HTMLMetaElement
                            )?.content ?? "",
                    },
                },
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message ?? "Failed to cancel payment.");
                return;
            }

            toast.success("Payment cancelled.");
            onPaymentChanged();
            fetchPayments();
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setActing(null);
        }
    }

    async function handleReopen(payment: ItemPayment) {
        const ok = await confirmAction({
            title: "Reopen Payment?",
            text: `This will reopen the cancelled payment of ৳${payment.amount.toFixed(2)}.`,
            confirmButtonText: "Yes, Reopen",
        });

        if (!ok) return;

        setActing(payment.id);

        try {
            const res = await fetch(
                route("backend.profit-distributions.items.payments.reopen", {
                    pd: distributionId,
                    item: itemId,
                    payment: payment.id,
                }),
                {
                    method: "PATCH",
                    headers: {
                        Accept: "application/json",
                        "X-CSRF-TOKEN":
                            (
                                document.querySelector(
                                    'meta[name="csrf-token"]',
                                ) as HTMLMetaElement
                            )?.content ?? "",
                    },
                },
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message ?? "Failed to reopen payment.");
                return;
            }

            toast.success("Payment reopened.");
            onPaymentChanged();
            fetchPayments();
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setActing(null);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h3 className="text-base font-semibold text-gray-800">
                            Payment History
                        </h3>
                        {summary && (
                            <p className="mt-0.5 text-sm text-gray-500">
                                {summary.investor_name}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Summary Bar */}
                {summary && (
                    <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50">
                        {[
                            {
                                label: "Effective",
                                value: summary.effective_amount,
                                color: "text-gray-800",
                            },
                            {
                                label: "Paid",
                                value: summary.total_paid,
                                color: "text-green-600",
                            },
                            {
                                label: "Remaining",
                                value: summary.remaining_amount,
                                color: "text-amber-600",
                            },
                            {
                                label: "Deferred",
                                value: summary.deferred_amount,
                                color: "text-purple-600",
                            },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="p-3 text-center">
                                <p className="text-xs text-gray-500">{label}</p>
                                <p
                                    className={`mt-0.5 text-sm font-semibold ${color}`}
                                >
                                    ৳{value.toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Body */}
                <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2
                                size={24}
                                className="animate-spin text-indigo-500"
                            />
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
                            <AlertTriangle size={28} />
                            <p className="text-sm">
                                No payment transactions recorded yet.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                                        #
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                                        Amount
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                                        Status
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                                        Method
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                                        By / At
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                                        Note
                                    </th>
                                    <th className="px-4 py-2.5 text-xs font-medium text-gray-500"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payments.map((p, idx) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-xs text-gray-400">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            ৳{p.amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[p.payment_status] ?? "bg-gray-100 text-gray-600"}`}
                                            >
                                                {p.payment_status_label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {p.payment_method ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            <div>{p.paid_by_name ?? "—"}</div>
                                            <div className="text-gray-400">
                                                {p.paid_at ?? "—"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {p.note ?? "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {!p.is_terminal && (
                                                    <button
                                                        onClick={() =>
                                                            handleCancel(p)
                                                        }
                                                        disabled={
                                                            acting === p.id
                                                        }
                                                        title="Cancel payment"
                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                                                    >
                                                        {acting === p.id ? (
                                                            <Loader2
                                                                size={13}
                                                                className="animate-spin"
                                                            />
                                                        ) : (
                                                            <XCircle
                                                                size={13}
                                                            />
                                                        )}
                                                    </button>
                                                )}
                                                {p.can_be_reopened && (
                                                    <button
                                                        onClick={() =>
                                                            handleReopen(p)
                                                        }
                                                        disabled={
                                                            acting === p.id
                                                        }
                                                        title="Reopen payment"
                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-500 disabled:opacity-40"
                                                    >
                                                        {acting === p.id ? (
                                                            <Loader2
                                                                size={13}
                                                                className="animate-spin"
                                                            />
                                                        ) : (
                                                            <RotateCcw
                                                                size={13}
                                                            />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
