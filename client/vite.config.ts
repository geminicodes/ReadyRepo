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
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.match(/\/react(\/|$)/) || id.includes("scheduler")) return "react";
          if (id.includes("react-router") || id.includes("history")) return "router";
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("firebase")) return "firebase";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("recharts") || id.includes("recharts-scale") || id.includes("d3-")) return "charts";
          if (id.includes("react-markdown") || id.includes("remark-gfm") || id.includes("micromark")) return "markdown";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("lucide-react")) return "icons";
          return "vendor";
        },
      },
    },
  },
}));
