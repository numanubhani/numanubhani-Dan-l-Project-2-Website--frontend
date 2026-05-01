import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: Number(env.VITE_DEV_PORT ?? 3000),
      host: '0.0.0.0',
      proxy: {
        '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/o': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/media': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/ws': { target: 'ws://127.0.0.1:8001', ws: true },
        '/hls': {
          target: 'http://127.0.0.1:8888',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/hls\/?/, '/') || '/',
        },
        '/whip': {
          target: 'http://127.0.0.1:8889',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/whip\/?/, '/') || '/',
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify: file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
