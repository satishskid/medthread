import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['sql.js']
  },
  server: {
    fs: {
      allow: ['..', 'node_modules/sql.js/dist/sql-wasm.wasm']
    }
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'sql.js': ['sql.js'],
          'tesseract': ['tesseract.js']
        }
      }
    }
  }
})