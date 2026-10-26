import { Modal } from "@mantine/core";
import { Link } from "@inertiajs/react";
import {
    Calendar,
    Globe,
    Mail,
    MapPin,
    Phone,
    ShoppingBag,
    User,
    Wallet,
    X,
    ExternalLink,
    Pencil,
    Copy,
    Check,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Customer } from "./CustomerModal";

interface Props {
    opened: boolean;
    onClose: () => void;
    customer: Customer | null;
    onEdit?: (customer: Customer) => void;
}

export default function CustomerPreviewModal({
    opened,
    onClose,
    customer,
    onEdit,
}: Props) {
    const [copied, setCopied] = useState(false);

    if (!customer) return null;

    const copyPhone = () => {
        if (!customer.phone) return;
        navigator.clipboard.writeText(customer.phone);
        setCopied(true);
        toast.success(`Copied "${customer.phone}" to clipboard`);
        setTimeout(() => setCopied(false), 2000);
    };

    const initials = customer.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            withCloseButton={false}
            size="md"
            padding={0}
            radius="lg"
            centered
        >
            <div className="bg-card text-foreground rounded-2xl overflow-hidden border border-border shadow-xl">
                {/* Header Banner */}
                <div className="relative bg-gradient-to-r from-primary/15 via-primary/5 to-muted p-6 border-b border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white shadow-md shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-foreground truncate">
                                    {customer.name}
                                </h3>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                        customer.is_active
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                            : "bg-muted text-muted-foreground border-border"
                                    }`}
                                >
                                    {customer.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                Customer ID #{customer.id}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body Details */}
                <div className="p-6 space-y-4">
                    {/* Financial Snapshot */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Wallet size={14} className="text-amber-500" />
                                <span>Opening Balance</span>
                            </div>
                            <p className="mt-1 text-base font-bold text-foreground">
                                ৳
                                {Number(customer.opening_balance || 0).toLocaleString(
                                    "en-BD",
                                    { minimumFractionDigits: 2 }
                                )}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ShoppingBag size={14} className="text-primary" />
                                <span>Sales History</span>
                            </div>
                            <Link
                                href={route("backend.pos.sales.index", {
                                    search: customer.phone || customer.name,
                                })}
                                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                                <span>View Customer Orders</span>
                                <ExternalLink size={12} />
                            </Link>
                        </div>
                    </div>

                    {/* Contact & Location */}
                    <div className="space-y-2.5 rounded-xl border border-border p-4 text-xs">
                        <div className="flex items-center justify-between py-1 border-b border-border/60">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone size={14} />
                                <span>Phone Number</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-medium text-foreground">
                                    {customer.phone || "Not provided"}
                                </span>
                                {customer.phone && (
                                    <button
                                        type="button"
                                        onClick={copyPhone}
                                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                        title="Copy phone"
                                    >
                                        {copied ? (
                                            <Check size={12} className="text-emerald-500" />
                                        ) : (
                                            <Copy size={12} />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-border/60">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail size={14} />
                                <span>Email</span>
                            </div>
                            <span className="font-medium text-foreground">
                                {customer.email || "Not provided"}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-border/60">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin size={14} />
                                <span>Location</span>
                            </div>
                            <span className="font-medium text-foreground text-right">
                                {customer.city
                                    ? `${customer.city}, ${customer.country || "Bangladesh"}`
                                    : customer.country || "Dhaka, Bangladesh"}
                            </span>
                        </div>

                        {customer.address && (
                            <div className="pt-1">
                                <span className="text-muted-foreground">Delivery Address:</span>
                                <p className="mt-1 text-foreground font-medium leading-relaxed">
                                    {customer.address}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-3.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        Close
                    </button>
                    {onEdit && (
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onEdit(customer);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors shadow-xs"
                        >
                            <Pencil size={13} />
                            <span>Edit Account</span>
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
