import { PageProps } from "@/types";
import { usePage } from "@inertiajs/react";

export function useSettings() {
    const { settings } = usePage<PageProps>().props;

    return {
        currency: settings.currency_symbol ?? "৳",
        currencyPosition: settings.currency_position ?? "before",
        decimalPlaces: Number(settings.decimal_places ?? 2),
        businessName: settings.business_name ?? "My Business",
        businessPhone: settings.business_phone ?? "",
        businessEmail: settings.business_email ?? "",
        businessAddress: settings.business_address ?? "",
        taxEnabled: settings.tax_enabled === "true",
        taxRate: Number(settings.tax_rate ?? 0),
        taxName: settings.tax_name ?? "VAT",
        raw: settings,
    };
}
