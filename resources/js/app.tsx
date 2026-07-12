import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { MantineProvider } from "@mantine/core";

import "@mantine/carousel/styles.css";
import "@mantine/code-highlight/styles.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/nprogress/styles.css";

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
                <MantineProvider defaultColorScheme="light">
                    <App {...props} />
                </MantineProvider>

                <Toaster richColors position="top-right" />
            </>,
        );
    },

    progress: {
        // color: "#4B5563",
        color: "#4f46e5",
    },
});
