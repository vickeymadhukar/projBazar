import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // ── Dev Server ────────────────────────────────────────────────────────────
  server: {
    port: 5173,

    // Proxy API calls to backend — avoids CORS issues in development
    // /api/... → http://localhost:5000/api/...
    proxy: {
      '/api': {
        target:      'http://localhost:4000',
        changeOrigin: true,
        secure:       false,
      },
      // Proxy Socket.io connection
      '/socket.io': {
        target:  'http://localhost:4000',
        ws:       true,         // enable WebSocket proxying
        changeOrigin: true,
      },
    },
  },

  // ── Build ─────────────────────────────────────────────────────────────────
  build: {
    outDir:        'dist',
    sourcemap:     true,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          react:   ['react', 'react-dom'],
          router:  ['react-router-dom'],
          query:   ['@tanstack/react-query'],
          zustand: ['zustand'],
        },
      },
    },
  },
});
