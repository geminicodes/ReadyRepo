import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    // Default Vite dev port (avoids colliding with API server :8080).
    port: 5173,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    process.env.ANALYZE === "true" &&
      visualizer({
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
        template: "treemap",
        open: false,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // IMPORTANT: keep all node_modules in ONE chunk to avoid circular chunk
        // dependencies that can break ESM execution order in some deployments.
        manualChunks(id) {
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },
  },
}));
