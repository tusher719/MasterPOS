import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import Swal from "sweetalert2";
import {
    X,
    RotateCcw,
    Trash2,
    Clock,
    Search,
    ChevronDown,
    Pencil,
    Loader2,
    Minus,
    Plus,
    Package,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HoldOrderItem {
    product_id: number;
    name: string;
    sku: string;
    unit_price: number;
    quantity: number;
    discount: number;
    subtotal: number;
    stock_qty: number;
    unit: string;
    image: string | null;
}

export interface HoldOrder {
    id: number;
    reference_no: string;
    status: "active" | "processing";
    customer: { id: number; name: string } | null;
    items: HoldOrderItem[];
    subtotal: number;
    discount: number;
    tax: number;
    grand_total: number;
    note: string | null;
    expires_at: string | null;
    created_at: string;
}

interface PaginatedResponse {
    data: HoldOrder[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onResume: (holdOrder: HoldOrder) => void;
    onCountChange: (count: number) => void;
    resumedHoldOrderId: number | null;
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
    order: HoldOrder;
    onClose: () => void;
    onSaved: (updated: HoldOrder) => void;
}

function EditModal({ order, onClose, onSaved }: EditModalProps) {
    const [note, setNote] = useState(order.note ?? "");

    // NOTE: order.items comes from the API with Laravel decimal-cast fields
    // (unit_price, discount, subtotal) serialized as STRINGS in JSON.
    // Normalize to Number() here so later `items.reduce((s, i) => s + i.subtotal, 0)`
    // does real addition instead of string concatenation (e.g. 0 + "10.00" -> "010.00").
    const [items, setItems] = useState(
        order.items.map((i) => ({
            ...i,
            unit_price: Number(i.unit_price),
            discount: Number(i.discount),
            subtotal: Number(i.subtotal),
            quantity: Number(i.quantity),
        })),
    );
    const [saving, setSaving] = useState(false);

    const updateItem = (
        index: number,
        field: "quantity" | "discount",
        raw: string,
    ) => {
        const value = Math.max(0, Number(raw) || 0);
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;
                const qty = field === "quantity" ? value : item.quantity;
                const disc = field === "discount" ? value : item.discount;
                const subtotal = Math.max(0, item.unit_price * qty - disc);
                return { ...item, [field]: value, subtotal };
            }),
        );
    };

    const stepQuantity = (index: number, delta: number) => {
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;
                const newQty = Math.max(
                    1,
                    Math.min(item.stock_qty, item.quantity + delta),
                );
                const subtotal = Math.max(
                    0,
                    item.unit_price * newQty - item.discount,
                );
                return { ...item, quantity: newQty, subtotal };
            }),
        );
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const discount = Number(order.discount);
    const tax = Number(order.tax);
    const grandTotal = Math.max(0, subtotal - discount + tax);

    const handleSave = async () => {
        if (items.length === 0) {
            toast.error("At least one item is required.");
            return;
        }
        setSaving(true);
        try {
            await axios.put(route("backend.pos.hold-orders.update", order.id), {
                customer_id: order.customer?.id ?? null,
                note,
                subtotal,
                discount,
                tax,
                grand_total: grandTotal,
                items: items.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    discount: i.discount,
                    subtotal: i.subtotal,
                })),
            });

            toast.success("Hold order updated.");
            onSaved({
                ...order,
                note: note || null,
                subtotal,
                grand_total: grandTotal,
                items,
            });
            onClose();
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message ?? "Failed to update hold order.",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="font-semibold text-gray-800">
                        Edit Hold Order&nbsp;
                        <span className="font-mono text-indigo-600 text-sm">
                            {order.reference_no}
                        </span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
                    {/* Items */}
                    <div className="space-y-2">
                        {items.map((item, idx) => (
                            <div
                                key={item.product_id}
                                className="rounded-md border border-gray-200 p-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        {item.image ? (
                                            <img
                                                src={`/storage/${item.image}`}
                                                alt={item.name}
                                                className="h-10 w-10 shrink-0 rounded-md
                                                           border border-gray-200 object-cover"
                                            />
                                        ) : (
                                            <div
                                                className="flex h-10 w-10 shrink-0 items-center
                                                           justify-center rounded-md border
                                                           border-gray-200 bg-gray-50 text-gray-300"
                                            >
                                                <Package size={16} />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-800">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {item.sku} · ৳
                                                {item.unit_price.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeItem(idx)}
                                        className="shrink-0 rounded p-1 text-gray-300
                                                   hover:bg-red-50 hover:text-red-500"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="mb-1 flex items-center justify-between">
                                            <label className="text-xs text-gray-500">
                                                Qty
                                            </label>
                                            <span className="text-[11px] text-gray-400">
                                                Available: {item.stock_qty}
                                            </span>
                                        </div>
                                        <div className="flex items-center rounded-md border border-gray-300">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    stepQuantity(idx, -1)
                                                }
                                                disabled={item.quantity <= 1}
                                                className="flex h-7 w-7 shrink-0 items-center
                                                           justify-center rounded-l-md text-gray-500
                                                           hover:bg-gray-100 active:scale-90
                                                           disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <input
                                                type="number"
                                                min={1}
                                                max={item.stock_qty}
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const raw =
                                                        Number(
                                                            e.target.value,
                                                        ) || 1;
                                                    const capped = Math.min(
                                                        raw,
                                                        item.stock_qty,
                                                    );
                                                    updateItem(
                                                        idx,
                                                        "quantity",
                                                        String(capped),
                                                    );
                                                }}
                                                className="h-7 w-full border-x border-gray-300
                                                           text-center text-sm focus:outline-none
                                                           focus:ring-0"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    stepQuantity(idx, 1)
                                                }
                                                disabled={
                                                    item.quantity >=
                                                    item.stock_qty
                                                }
                                                className="flex h-7 w-7 shrink-0 items-center
                                                           justify-center rounded-r-md text-gray-500
                                                           hover:bg-gray-100 active:scale-90
                                                           disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-gray-500">
                                            Item Discount (৳)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={item.discount}
                                            onChange={(e) =>
                                                updateItem(
                                                    idx,
                                                    "discount",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-md border border-gray-300 px-2
                                                       py-1 text-sm focus:border-indigo-500
                                                       focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <p className="mt-1.5 text-right text-xs font-medium text-gray-700">
                                    Subtotal: ৳{item.subtotal.toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Note */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Note
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-gray-300 px-3 py-2
                                       text-sm focus:border-indigo-500 focus:outline-none
                                       focus:ring-1 focus:ring-indigo-500"
                            placeholder="Optional note…"
                        />
                    </div>

                    {/* Totals */}
                    <div className="rounded-md bg-gray-50 p-3 text-sm space-y-1">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>৳{subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Discount</span>
                                <span>- ৳{discount.toFixed(2)}</span>
                            </div>
                        )}
                        {tax > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Tax</span>
                                <span>+ ৳{tax.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-800">
                            <span>Grand Total</span>
                            <span>৳{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm
                                   text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4
                                   py-2 text-sm font-medium text-white hover:bg-indigo-700
                                   disabled:opacity-50"
                    >
                        {saving && (
                            <Loader2 size={14} className="animate-spin" />
                        )}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

export default function HoldOrdersDrawer({
    open,
    onClose,
    onResume,
    onCountChange,
    resumedHoldOrderId,
}: Props) {
    const [orders, setOrders] = useState<HoldOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [date, setDate] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [resumingId, setResumingId] = useState<number | null>(null);
    const [editingOrder, setEditingOrder] = useState<HoldOrder | null>(null);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch on open or filter change
    useEffect(() => {
        if (!open) return;
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            fetchOrders(1, true);
        }, 350);
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [open, search, date]);

    const fetchOrders = async (page = 1, reset = false) => {
        reset ? setLoading(true) : setLoadingMore(true);
        try {
            const res = await axios.get<PaginatedResponse>(
                route("backend.pos.hold-orders.index"),
                { params: { search, date, page } },
            );
            const fetched = res.data.data ?? [];
            setOrders((prev) => (reset ? fetched : [...prev, ...fetched]));
            setCurrentPage(res.data.current_page);
            setLastPage(res.data.last_page);
            setTotal(res.data.total);
            onCountChange(res.data.total);
        } catch {
            toast.error("Failed to load held orders.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleResume = async (order: HoldOrder) => {
        if (order.status === "processing") return;
        setResumingId(order.id);
        try {
            const res = await axios.post(
                route("backend.pos.hold-orders.resume", order.id),
            );
            const resumed: HoldOrder = {
                ...order,
                status: "processing",
                items: res.data.hold_order?.items ?? order.items,
            };
            setOrders((prev) =>
                prev.map((o) => (o.id === order.id ? resumed : o)),
            );
            onResume(resumed);
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message ?? "Failed to resume hold order.",
            );
        } finally {
            setResumingId(null);
        }
    };

    const handleDelete = async (order: HoldOrder) => {
        const warn =
            order.status === "processing"
                ? "This order is currently being processed. Delete anyway?"
                : `Delete hold order ${order.reference_no}?`;

        const result = await Swal.fire({
            title: "Delete Hold Order?",
            text: warn,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
            confirmButtonColor: "#ef4444",
            cancelButtonText: "Cancel",
        });
        if (!result.isConfirmed) return;

        setDeletingId(order.id);
        try {
            await axios.delete(
                route("backend.pos.hold-orders.destroy", order.id),
            );
            setOrders((prev) => prev.filter((o) => o.id !== order.id));
            const newTotal = Math.max(0, total - 1);
            setTotal(newTotal);
            onCountChange(newTotal);
            toast.success("Hold order deleted.");
        } catch {
            toast.error("Failed to delete hold order.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleEditSaved = (updated: HoldOrder) => {
        setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o)),
        );
    };

    const statusBadge = (status: "active" | "processing") =>
        status === "processing" ? (
            <span
                className="rounded-full bg-amber-100 px-2 py-0.5 text-xs
                             font-medium text-amber-700"
            >
                Processing
            </span>
        ) : (
            <span
                className="rounded-full bg-green-100 px-2 py-0.5 text-xs
                             font-medium text-green-700"
            >
                Active
            </span>
        );

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex justify-end">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/30"
                    onClick={onClose}
                />

                {/* Panel */}
                <div className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <div>
                            <h2 className="font-semibold text-gray-800">
                                Held Orders
                            </h2>
                            {total > 0 && (
                                <p className="text-xs text-gray-400">
                                    {total} order{total !== 1 ? "s" : ""}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100
                                       hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="border-b border-gray-100 px-4 py-3 space-y-2">
                        <div className="relative">
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search reference or customer…"
                                className="w-full rounded-md border border-gray-300 py-1.5
                                           pl-8 pr-3 text-sm focus:border-indigo-500
                                           focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-1.5
                                       text-sm text-gray-600 focus:border-indigo-500
                                       focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2
                                    size={22}
                                    className="animate-spin text-indigo-400"
                                />
                            </div>
                        ) : orders.length === 0 ? (
                            <p className="py-10 text-center text-sm text-gray-400">
                                {search || date
                                    ? "No orders match your search."
                                    : "No held orders."}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {orders.map((order) => {
                                    const isResumed =
                                        resumedHoldOrderId === order.id;
                                    const isProcessing =
                                        order.status === "processing";

                                    return (
                                        <div
                                            key={order.id}
                                            className={`rounded-lg border p-3 transition-colors ${
                                                isResumed
                                                    ? "border-amber-400 bg-amber-50"
                                                    : isProcessing
                                                      ? "border-gray-200 bg-gray-50 opacity-75"
                                                      : "border-gray-200 bg-white"
                                            }`}
                                        >
                                            {/* Top row */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-mono text-xs font-semibold text-indigo-600">
                                                        {order.reference_no}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-sm font-medium text-gray-800">
                                                        {order.customer?.name ??
                                                            "Walk-in Customer"}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        ৳
                                                        {Number(
                                                            order.grand_total,
                                                        ).toFixed(2)}
                                                    </p>
                                                    {statusBadge(order.status)}
                                                </div>
                                            </div>

                                            {/* Meta row */}
                                            <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={11} />
                                                    {order.created_at}
                                                </span>
                                                <span>
                                                    {order.items.length} item
                                                    {order.items.length !== 1
                                                        ? "s"
                                                        : ""}
                                                </span>
                                                {order.expires_at && (
                                                    <span className="text-amber-500">
                                                        Exp: {order.expires_at}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Item names preview */}
                                            <p className="mt-1 truncate text-xs text-gray-500">
                                                {order.items
                                                    .map((i) => i.name)
                                                    .join(", ")}
                                            </p>

                                            {order.note && (
                                                <p className="mt-1 truncate text-xs italic text-gray-400">
                                                    {order.note}
                                                </p>
                                            )}

                                            {/* Actions */}
                                            <div className="mt-2 flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleResume(order)
                                                    }
                                                    disabled={
                                                        isProcessing ||
                                                        resumingId === order.id
                                                    }
                                                    className="flex flex-1 items-center justify-center
                                                               gap-1.5 rounded-md bg-indigo-600 py-1.5
                                                               text-xs font-medium text-white
                                                               hover:bg-indigo-700 disabled:cursor-not-allowed
                                                               disabled:opacity-50"
                                                >
                                                    {resumingId === order.id ? (
                                                        <Loader2
                                                            size={12}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <RotateCcw size={12} />
                                                    )}
                                                    {isProcessing
                                                        ? "In Progress"
                                                        : "Resume"}
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        setEditingOrder(order)
                                                    }
                                                    disabled={isProcessing}
                                                    className="flex items-center justify-center rounded-md
                                                               border border-gray-200 px-2.5 py-1.5
                                                               text-gray-400 hover:bg-gray-100
                                                               hover:text-gray-600 disabled:cursor-not-allowed
                                                               disabled:opacity-40"
                                                >
                                                    <Pencil size={13} />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDelete(order)
                                                    }
                                                    disabled={
                                                        deletingId === order.id
                                                    }
                                                    className="flex items-center justify-center rounded-md
                                                               border border-gray-200 px-2.5 py-1.5
                                                               text-gray-400 hover:bg-red-50
                                                               hover:text-red-500 disabled:opacity-50"
                                                >
                                                    {deletingId === order.id ? (
                                                        <Loader2
                                                            size={13}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Trash2 size={13} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Load More */}
                                {currentPage < lastPage && (
                                    <button
                                        onClick={() =>
                                            fetchOrders(currentPage + 1, false)
                                        }
                                        disabled={loadingMore}
                                        className="flex w-full items-center justify-center gap-2
                                                   rounded-lg border border-gray-200 py-2 text-sm
                                                   text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        {loadingMore ? (
                                            <Loader2
                                                size={14}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <ChevronDown size={14} />
                                        )}
                                        {loadingMore ? "Loading…" : "Load more"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal — rendered outside drawer z-stack */}
            {editingOrder && (
                <EditModal
                    order={editingOrder}
                    onClose={() => setEditingOrder(null)}
                    onSaved={(updated) => {
                        handleEditSaved(updated);
                        setEditingOrder(null);
                    }}
                />
            )}
        </>
    );
}
