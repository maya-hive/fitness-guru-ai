import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(), // Enables React fast refresh, JSX, etc.
        tailwindcss(),
    ],

    server: {
        port: 5173,          // Frontend runs on this port
        open: true,          // Auto open browser
        strictPort: true,    // Fail if port is already in use
        proxy: {
            // Forward API calls to backend
            "/api": {
                target: "http://localhost:3001",
                changeOrigin: true,
                secure: false
            }
        }
    },

    build: {
        outDir: "dist",      // Production build folder
        sourcemap: false,    // Disable sourcemaps in production
        chunkSizeWarningLimit: 1000
    },

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        }
    }
});
