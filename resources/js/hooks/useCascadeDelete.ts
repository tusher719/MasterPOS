import { DeleteEntityType } from "@/Components/shared/ConfirmDeleteModal";
import { router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DeleteTarget {
    id: number;
    type: DeleteEntityType;
    /** The Inertia DELETE route to call on confirm */
    deleteRoute: string;
    /** Display name shown in toast messages */
    displayName?: string;
}

interface UseCascadeDeleteReturn {
    /** The currently pending delete target — pass to ConfirmDeleteModal */
    target: DeleteTarget | null;
    /** Open the modal for a given target */
    openModal: (target: DeleteTarget) => void;
    /** Close the modal without deleting */
    closeModal: () => void;
    /** Call this as the onConfirm prop of ConfirmDeleteModal */
    confirmDelete: () => void;
    /** True while the Inertia delete request is in-flight */
    deleting: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages the full cascade-delete flow:
 *  1. Caller calls openModal({ id, type, deleteRoute, displayName })
 *  2. ConfirmDeleteModal fetches dependency preview from backend
 *  3. User confirms → confirmDelete() fires Inertia DELETE
 *  4. Success/error toasts shown automatically
 *
 * Usage:
 *
 *   const { target, openModal, closeModal, confirmDelete, deleting } =
 *       useCascadeDelete();
 *
 *   // In JSX:
 *   <button onClick={() => openModal({ id: inv.id, type: 'investment',
 *       deleteRoute: route('backend.investments.destroy', inv.id),
 *       displayName: inv.title })}>
 *     Delete
 *   </button>
 *
 *   {target && (
 *     <ConfirmDeleteModal
 *       entityType={target.type}
 *       entityId={target.id}
 *       onConfirm={confirmDelete}
 *       onClose={closeModal}
 *     />
 *   )}
 */
export function useCascadeDelete(): UseCascadeDeleteReturn {
    const [target, setTarget] = useState<DeleteTarget | null>(null);
    const [deleting, setDeleting] = useState(false);

    const openModal = (t: DeleteTarget) => setTarget(t);
    const closeModal = () => setTarget(null);

    const confirmDelete = () => {
        if (!target) return;

        const { deleteRoute, displayName } = target;

        setDeleting(true);

        router.delete(deleteRoute, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    displayName
                        ? `"${displayName}" deleted successfully.`
                        : "Record deleted successfully.",
                );
            },
            onError: (errors) => {
                const message =
                    Object.values(errors)[0] ??
                    "Delete failed. Please try again.";
                toast.error(String(message));
            },
            onFinish: () => {
                setDeleting(false);
                setTarget(null);
            },
        });
    };

    return { target, openModal, closeModal, confirmDelete, deleting };
}
