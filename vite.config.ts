import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { PluginOption } from 'vite';

declare function require(module: string): any;

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
    try {
      const { visualizer } = require('rollup-plugin-visualizer');
      plugins.push(
        visualizer({
          open: true,
          filename: 'bundle-analyzer-report.html',
          gzipSize: true,
          brotliSize: true,
        }) as PluginOption
      );
    } catch (e) {
      console.warn('rollup-plugin-visualizer not available');
    }
  }

  const config: UserConfig = {
    plugins: plugins.length > 0 ? plugins : undefined,
    
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
      rollupOptions: {
        preserveEntrySignatures: 'strict',
        external: [],
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