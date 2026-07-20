import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // We already manage public/manifest.json + <link rel="manifest"> by
      // hand (see index.html) — don't let the plugin generate/inject its own.
      manifest: false,
      // FCM's getToken() looks up the service worker at this exact path by
      // default (see src/utils/pushNotifications.ts / firebase/messaging).
      // Keep the filename/scope unchanged so push notifications keep working
      // while we add app-shell precaching to the same worker.
      filename: 'firebase-messaging-sw.js',
      srcDir: 'src',
      strategies: 'injectManifest',
      injectManifest: {
        // src/firebase-messaging-sw.js imports firebase/app +
        // firebase/messaging/sw and workbox-precaching/workbox-routing —
        // bundle them into the SW. Note: vite-plugin-pwa resolves the SW
        // source at `srcDir/filename`, so the source file must share the
        // exact output filename below.
        injectionPoint: 'self.__WB_MANIFEST',
      },
      // We register the SW manually in src/main.tsx (kept close to the
      // existing FCM registration code) rather than via the plugin's
      // virtual:pwa-register module.
      injectRegister: false,
      devOptions: {
        // Keep dev simple: no SW / precaching while running `vite dev`.
        // FCM background messages aren't needed in local dev, and
        // injectManifest + dev-mode SW reloads are a common source of
        // stale-cache bugs. Build-only is enough for Phase 6.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    minify: 'esbuild',
    sourcemap: true, // Enable source maps for better debugging
    target: 'es2020', // Target modern browsers only (no legacy polyfills)
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'ui-vendor': ['lucide-react', 'date-fns'],
        },
        sourcemapExcludeSources: true, // Don't include source code in maps for security
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],  // Remove console.* and debugger in production
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://bustadurinn.is',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['node_modules/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/utils/seedDemoData.ts',
      ],
    },
  },
})
