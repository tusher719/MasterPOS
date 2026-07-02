import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [
        laravel({
            input: "resources/js/app.tsx",
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            // shadcn/ui alias
            "@": path.resolve(__dirname, "./resources/js"),
            // Ziggy alias — points to the auto-generated file
            "ziggy-js": path.resolve(
                __dirname,
                "vendor/tightenco/ziggy/dist/index.esm.js",
            ),
        },
    },
});
