import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { PluginOption } from 'vite';

export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['date-fns', 'lodash', 'axios'],
        },
      },
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
