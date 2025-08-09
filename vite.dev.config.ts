import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.config";

// Development specific configuration for Replit
// This fixes the "Blocked request" error by allowing all hosts
export default mergeConfig(baseConfig, defineConfig({
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: {
      clientPort: 443,
      host: "0.0.0.0",
    },
  },
  define: {
    'process.env.DANGEROUSLY_DISABLE_HOST_CHECK': '"true"',
  },
}));