import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split large vendor bundles so the main app chunk stays smaller.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('reactflow')) return 'reactflow'
          if (id.includes('react-router')) return 'router'
          if (id.includes('react-bootstrap') || id.includes('bootstrap')) {
            return 'bootstrap'
          }
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('axios')) return 'http'
          if (id.includes('react') || id.includes('scheduler')) return 'react'
          return 'vendor'
        },
      },
    },
  },
})
