import { usePage } from "@inertiajs/react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function useFlashToast() {
    const page = usePage();
    const flash = (page.props as any).flash as
        | { success?: string; error?: string }
        | undefined;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);
}
