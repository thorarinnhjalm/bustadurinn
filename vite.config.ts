import { defineConfig } from 'vite'
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
    rollupOptions: {
      output: {
        manualChunks: undefined,
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
})
