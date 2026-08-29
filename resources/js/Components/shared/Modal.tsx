import { Fragment, PropsWithChildren } from "react";
import { X } from "lucide-react";

interface ModalProps extends PropsWithChildren {
    show: boolean;
    onClose: () => void;
    title: string;
    maxWidth?: "sm" | "md" | "lg" | "xl";
}

const widths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
};

export default function Modal({
    show,
    onClose,
    title,
    maxWidth = "md",
    children,
}: ModalProps) {
    if (!show) return null;

    return (
        <Fragment>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className={`w-full ${widths[maxWidth]} rounded-xl border border-border bg-card shadow-xl`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-foreground">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4">{children}</div>
                </div>
            </div>
        </Fragment>
    );
}
