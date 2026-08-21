// OrderBlockedModal.tsx
// Item 6.5 — Order-Blocked Popup
//
// Layer 2 (IP limit) বা Layer 3 (success ratio) block করলে এই modal দেখায়।
// fraud_block_message settings থেকে পড়ে — globally shared via HandleInertiaRequests.
// Contact buttons শুধু তখনই দেখায় যখন respective setting non-null।

import { usePage } from "@inertiajs/react";
import { ExternalLink, MessageCircle, Phone, XCircle } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function OrderBlockedModal({ isOpen, onClose }: Props) {
    if (!isOpen) return null;

    const { settings } = usePage().props as {
        settings: Record<string, string | null>;
    };

    // Fallback message যদি admin এখনো fraud_block_message set না করে
    const blockMessage =
        settings?.fraud_block_message ||
        "আপনার অর্ডারটি এই মুহূর্তে গ্রহণ করা সম্ভব হচ্ছে না। অনুগ্রহ করে আমাদের সাথে সরাসরি যোগাযোগ করুন।";

    const whatsapp = settings?.fraud_contact_whatsapp ?? null;
    const phone = settings?.fraud_contact_phone ?? null;
    const facebook = settings?.fraud_contact_facebook ?? null;

    const hasContacts = !!(whatsapp || phone || facebook);

    return (
        // Backdrop — click করলে modal বন্ধ হবে
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            {/* Modal card */}
            <div
                className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button — top right */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                >
                    ✕
                </button>

                {/* Red X icon */}
                <div className="flex justify-center mb-4">
                    <XCircle className="h-14 w-14 text-red-500" />
                </div>

                {/* Fixed title */}
                <h2 className="text-center text-xl font-bold text-gray-800 mb-3">
                    অর্ডারটি গ্রহণ করা সম্ভব হচ্ছে না!
                </h2>

                {/* Customizable message — business_settings.fraud_block_message */}
                <p className="text-center text-sm text-gray-600 leading-relaxed mb-5">
                    {blockMessage}
                </p>

                {/* Contact buttons — শুধু তখনই দেখাবে যখন কমপক্ষে একটা contact set আছে */}
                {hasContacts && (
                    <div className="flex flex-wrap justify-center gap-3 mb-4">
                        {whatsapp && (
                            <a
                                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2
                                           text-sm font-medium text-white hover:bg-green-600 transition-colors"
                            >
                                <MessageCircle className="h-4 w-4" />
                                WhatsApp
                            </a>
                        )}

                        {phone && (
                            <a
                                href={`tel:${phone}`}
                                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2
                                           text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                            >
                                <Phone className="h-4 w-4" />
                                Call
                            </a>
                        )}

                        {facebook && (
                            <a
                                href={facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2
                                           text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Facebook
                            </a>
                        )}
                    </div>
                )}

                {/* Dismiss button */}
                <button
                    onClick={onClose}
                    className="w-full rounded-lg border border-gray-300 py-2 text-sm
                               text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    বন্ধ করুন
                </button>
            </div>
        </div>
    );
}
