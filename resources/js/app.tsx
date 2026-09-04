import { createInertiaApp } from "@inertiajs/react";
import { MantineProvider } from "@mantine/core";

import "../css/app.css";
import "./bootstrap";

import "@mantine/carousel/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/code-highlight/styles.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/nprogress/styles.css";
import "@mantine/tiptap/styles.css";

import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob("./Pages/**/*.tsx"),
        ),

    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                {/* auto — Mantine follows html.dark class */}
                <MantineProvider defaultColorScheme="auto">
                    <App {...props} />
                </MantineProvider>

                <Toaster richColors position="top-right" />
            </>,
        );
    },

    progress: {
        color: "#4f46e5",
    },
});
