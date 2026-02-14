import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: {},
  },
  base: process.env.GITHUB_PAGES ? '/aioli/' : '/',
  build: {
    outDir: 'dist-site',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        demo: resolve(__dirname, 'demo.html'),
        docs: resolve(__dirname, 'docs.html'),
      },
    },
  },
});
