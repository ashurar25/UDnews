import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import type { PluginOption } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }): UserConfig => {
  const isProduction = mode === 'production';
  const isAnalyze = mode === 'analyze';

  const plugins: PluginOption[] = [
    react({
      include: '**/*.tsx',
    })
  ];

  if (isAnalyze) {
    plugins.push(
      visualizer({
        open: true,
        filename: 'bundle-analyzer-report.html',
        gzipSize: true,
        brotliSize: true,
      }) as PluginOption
    );
  }

  const config: UserConfig = {
    plugins,
    
    resolve: {
      alias: [
        {
          find: '@',
          replacement: path.resolve(__dirname, 'client/src')
        },
        {
          find: '@shared',
          replacement: path.resolve(__dirname, 'shared')
        },
        {
          find: '@assets',
          replacement: path.resolve(__dirname, 'attached_assets')
        }
      ]
    },

    root: path.resolve(__dirname, 'client'),

    build: {
      outDir: path.resolve(__dirname, 'dist/public'),
      emptyOutDir: true,
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      chunkSizeWarningLimit: 1000,
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        output: {
          comments: false,
        },
      } : undefined,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            vendor: ['lodash', 'axios', 'date-fns'],
          },
        },
      },
    },

    server: {
      host: '0.0.0.0',
      hmr: {
        overlay: false,
      },
      fs: {
        allow: ['..'],
      },
    },

    preview: {
      host: '0.0.0.0',
    },

    cacheDir: 'node_modules/.vite',

    optimizeDeps: {
      include: ['react', 'react-dom'],
      esbuildOptions: {
        target: 'esnext',
        define: {
          global: 'globalThis',
        },
      },
    },
  };

  return config;
});