// resources/js/Layouts/PublicLayout.tsx

import Footer from "@/Components/Public/Footer";
import Header from "@/Components/Public/Header";
import { PublicCategory, PublicSettings } from "@/types/public";
import { Head, usePage } from "@inertiajs/react";
import { PropsWithChildren } from "react";

interface PublicLayoutProps extends PropsWithChildren {
    settings?: PublicSettings;
    categories?: PublicCategory[];
    cartCount?: number;
}

export default function PublicLayout({
    children,
    settings: propSettings,
    categories = [],
    cartCount = 0,
}: PublicLayoutProps) {
    const pageSettings = (usePage().props as unknown as { settings?: PublicSettings })?.settings;
    const settings = propSettings ?? pageSettings ?? ({} as PublicSettings);

    return (
        <>
            <Head>
                {settings?.logo_image_path && (
                    <link
                        rel="icon"
                        type="image/png"
                        href={`/storage/${settings.logo_image_path}`}
                    />
                )}
            </Head>

            <div className="flex min-h-screen flex-col bg-gray-50">
                <Header
                    settings={settings}
                    categories={categories}
                    cartCount={cartCount}
                />
                <main className="flex-1 w-full">{children}</main>
                <Footer settings={settings} categories={categories} />
            </div>
        </>
    );
}
