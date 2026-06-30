import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png', 'offline.html'],
      manifest: {
        name: 'RentEase — Property Rental & Booking',
        short_name: 'RentEase',
        description: 'Find and book your perfect rental property with RentEase.',
        theme_color: '#ff385c',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'any',
        icons: [
          { src: '/icons/icon-72x72.svg',  sizes: '72x72',  type: 'image/svg+xml', purpose: 'maskable any' },
          { src: '/icons/icon-96x96.svg',  sizes: '96x96',  type: 'image/svg+xml', purpose: 'maskable any' },
          { src: '/icons/icon-128x128.svg', sizes: '128x128', type: 'image/svg+xml', purpose: 'maskable any' },
          { src: '/icons/icon-144x144.svg', sizes: '144x144', type: 'image/svg+xml', purpose: 'maskable any' },
          { src: '/icons/icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml', purpose: 'maskable any' },
          { src: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'maskable any' },
          { src: '/icons/icon-384x384.svg', sizes: '384x384', type: 'image/svg+xml', purpose: 'maskable any' },
          { src: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable any' },
        ],
        shortcuts: [
          {
            name: 'Browse Properties',
            short_name: 'Properties',
            url: '/properties',
            icons: [{ src: '/icons/icon-96x96.svg', sizes: '96x96' }],
          },
          {
            name: 'My Wishlist',
            short_name: 'Wishlist',
            url: '/wishlist',
            icons: [{ src: '/icons/icon-96x96.svg', sizes: '96x96' }],
          },
          {
            name: 'Messages',
            short_name: 'Messages',
            url: '/messages',
            icons: [{ src: '/icons/icon-96x96.svg', sizes: '96x96' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\/api\/properties/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-properties-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],

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
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-icons': ['react-icons'],
          'vendor-toast': ['react-hot-toast'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-hot-toast', 'axios'],
  },

  test: {
    // Vitest configuration — completely separate from Vite build
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
    // Exclude node_modules, dist, and E2E tests
    exclude: ['node_modules', 'dist', 'dev-dist', '**/*.e2e.*', '**/*.spec.*'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
