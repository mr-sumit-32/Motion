import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom')
            ) {
              return 'react';
            }

            if (
              id.includes('@tiptap') ||
              id.includes('prosemirror')
            ) {
              return 'tiptap';
            }

            if (id.includes('firebase')) {
              return 'firebase';
            }

            if (id.includes('lucide-react')) {
              return 'icons';
            }
          }
        },
      },
    },
  },
})
