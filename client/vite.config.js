import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // React + router core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Chart library (heavy)
          'vendor-recharts': ['recharts'],
          // Icon library
          'vendor-icons': ['react-icons'],
          // Toast notifications
          'vendor-toast': ['react-hot-toast'],
        },
      },
    },
    // Warn on chunks > 600 kB
    chunkSizeWarningLimit: 600,
    // Enable source maps in production for error tracking (disable if not needed)
    sourcemap: false,
  },

  // Pre-bundle these to speed up dev server startup
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-hot-toast',
      'axios',
    ],
  },
});
