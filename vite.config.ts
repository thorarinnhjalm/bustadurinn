import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
