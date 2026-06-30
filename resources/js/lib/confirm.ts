import Swal from "sweetalert2";

interface ConfirmOptions {
    title?: string;
    text?: string;
    confirmButtonText?: string;
    icon?: "warning" | "question" | "error";
}

export async function confirmAction(
    options: ConfirmOptions = {},
): Promise<boolean> {
    const result = await Swal.fire({
        title: options.title ?? "Are you sure?",
        text: options.text ?? "This action cannot be undone.",
        icon: options.icon ?? "warning",
        showCancelButton: true,
        confirmButtonText: options.confirmButtonText ?? "Yes, proceed",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#6b7280",
        reverseButtons: true,
    });

    return result.isConfirmed;
}
