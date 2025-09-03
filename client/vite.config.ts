import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: 'terser',
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit (in kbs)
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
    hmr: {
      overlay: false,
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@babel/runtime'],
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});
