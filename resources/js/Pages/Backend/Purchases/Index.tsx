    // resources/js/Pages/Backend/Purchases/Index.tsx

    import React, { useState, useCallback } from "react";
    import { Head, Link, router } from "@inertiajs/react";
    import axios from "axios";
    import { Plus } from "lucide-react";
    import { toast } from "sonner";
    import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
    import PurchaseStatsCards from "./_components/PurchaseStatsCards";
    import PurchaseFilters from "./_components/PurchaseFilters";
    import PurchaseTable from "./_components/PurchaseTable";
    import BulkActionBar from "./_components/BulkActionBar";
    import PaymentModal from "./_components/PaymentModal";
    import PaymentsListModal from "./_components/PaymentsListModal";
    import useFlashToast from "@/hooks/useFlashToast";

    // ─── Types ────────────────────────────────────────────────────────────────────

    interface Supplier {
        id: number;
        name: string;
    }

    interface PaymentMethod {
        id: number;
        name: string;
    }

    interface Purchase {
        id: number;
        reference_no: string;
        purchase_date: string;
        purchase_status: string;
        payment_status: string;
        grand_total: number;
        paid_amount: number;
        due_amount: number;
        supplier: Supplier;
        deleted_at: string | null;
    }

    interface Payment {
        id: number;
        amount: number;
        payment_date: string;
        reference: string | null;
        note: string | null;
        payment_method: { id: number; name: string } | null;
        created_by: { id: number; name: string } | null;
        created_at: string;
    }

    interface PaginationLink {
        url: string | null;
        label: string;
        active: boolean;
    }

    interface Paginated<T> {
        data: T[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    }

    interface Stats {
        total_purchases: number;
        total_amount: number;
        total_paid: number;
        total_due: number;
    }

    interface Filters {
        search?: string;
        supplier_id?: string | number;
        purchase_status?: string;
        payment_status?: string;
        date_from?: string;
        date_to?: string;
        trashed?: boolean;
    }

    interface Can {
        create: boolean;
        edit: boolean;
        delete: boolean;
        restore: boolean;
        payment: boolean;
        export: boolean;
    }

    interface Props {
        purchases: Paginated<Purchase>;
        suppliers: Supplier[];
        paymentMethods: PaymentMethod[];
        stats: Stats;
        filters: Filters;
        can: Can;
    }

    // ─── Component ────────────────────────────────────────────────────────────────

    export default function Index({
        purchases,
        suppliers,
        paymentMethods,
        stats,
        filters,
        can,
    }: Props) {
        useFlashToast();

        // ── Selection State ───────────────────────────────────────────────────────
        const [selectedIds, setSelectedIds] = useState<number[]>([]);

        // ── Modal State ───────────────────────────────────────────────────────────
        const [paymentModal, setPaymentModal] = useState<Purchase | null>(null);
        const [paymentsListModal, setPaymentsListModal] = useState<{
            purchase: Purchase;
            payments: Payment[];
        } | null>(null);
        const [loadingPayments, setLoadingPayments] = useState(false);

        // ── Filter Handler ────────────────────────────────────────────────────────
        const handleFilterChange = useCallback(
            (key: keyof Filters, value: string | boolean) => {
                router.get(
                    route("backend.purchases.index"),
                    { ...filters, [key]: value, page: 1 },
                    { preserveScroll: true, preserveState: true },
                );
            },
            [filters],
        );

        function handleClearFilters() {
            router.get(
                route("backend.purchases.index"),
                {},
                { preserveScroll: true, preserveState: true },
            );
        }

        // ── Selection Handlers ────────────────────────────────────────────────────
        function handleSelect(id: number) {
            setSelectedIds((prev) =>
                prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
            );
        }

        function handleSelectAll(ids: number[]) {
            setSelectedIds(ids);
        }

        function clearSelection() {
            setSelectedIds([]);
        }

        // ── Open Payments List Modal ───────────────────────────────────────────────
        async function openPaymentsModal(purchase: Purchase) {
            setLoadingPayments(true);

            try {
                const { data } = await axios.get(
                    route("backend.purchases.payments.index", purchase.id),
                    { headers: { Accept: "application/json" } },
                );

                setPaymentsListModal({
                    purchase,
                    payments: data.payments ?? [],
                });
            } catch (error) {
                toast.error("Failed to load payments.");
            } finally {
                setLoadingPayments(false);
            }
        }

        return (
            <AuthenticatedLayout>
                <Head title="Purchases" />

                <div className="space-y-5">
                    {/* ── Page Header ───────────────────────────────────────────── */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                Purchase & Inventory
                            </h1>
                            <p className="mt-0.5 text-sm text-gray-500">
                                Manage purchase orders and track inventory
                                movements.
                            </p>
                        </div>

                        {can.create && (
                            <Link
                                href={route("backend.purchases.create")}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600
                                        px-4 py-2 text-sm font-medium text-white
                                        hover:bg-indigo-700 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                New Purchase
                            </Link>
                        )}
                    </div>

                    {/* ── Stats Cards ───────────────────────────────────────────── */}
                    <PurchaseStatsCards stats={stats} />

                    {/* ── Filters ───────────────────────────────────────────────── */}
                    <PurchaseFilters
                        filters={filters}
                        suppliers={suppliers}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                    />

                    {/* ── Table ─────────────────────────────────────────────────── */}
                    <PurchaseTable
                        purchases={purchases}
                        can={can}
                        selectedIds={selectedIds}
                        onSelect={handleSelect}
                        onSelectAll={handleSelectAll}
                        onRecordPayment={(purchase) => setPaymentModal(purchase)}
                        onViewPayments={(purchase) => openPaymentsModal(purchase)}
                    />

                    {/* ── Bulk Action Bar ───────────────────────────────────────── */}
                    <BulkActionBar
                        selectedIds={selectedIds}
                        purchases={purchases.data.map((p) => ({
                            id: p.id,
                            due_amount: p.due_amount,
                            purchase_status: p.purchase_status,
                            payment_status: p.payment_status,
                        }))}
                        onClear={clearSelection}
                        showTrashed={!!filters.trashed}
                        can={can}
                    />

                    {/* ── Payment Modal ─────────────────────────────────────────── */}
                    {paymentModal && (
                        <PaymentModal
                            purchase={paymentModal}
                            paymentMethods={paymentMethods}
                            onClose={() => setPaymentModal(null)}
                        />
                    )}

                    {/* ── Payments List Modal ───────────────────────────────────── */}
                    {paymentsListModal && (
                        <PaymentsListModal
                            purchase={paymentsListModal.purchase}
                            payments={paymentsListModal.payments}
                            canManage={can.payment}
                            onClose={() => setPaymentsListModal(null)}
                            onRecordNew={() => {
                                setPaymentModal(paymentsListModal.purchase);
                                setPaymentsListModal(null);
                            }}
                        />
                    )}
                </div>
            </AuthenticatedLayout>
        );
    }
