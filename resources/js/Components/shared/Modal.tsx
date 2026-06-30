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
                    className={`w-full ${widths[maxWidth]} rounded-xl bg-white shadow-xl`}
                >
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <h2 className="text-base font-semibold text-gray-800">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <div className="px-5 py-4">{children}</div>
                </div>
            </div>
        </Fragment>
    );
}
