import { defineConfig } from "vite";
import path from "path";

// Simplified Replit-compatible Vite configuration
export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: {
      clientPort: 443,
      host: "0.0.0.0",
    },
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});