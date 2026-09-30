/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * URL pública del sitio para las vistas previas al compartir (Open Graph).
 * VITE_SITE_URL tiene prioridad; en Vercel se usa su dominio de producción.
 */
const siteUrl = (process.env.VITE_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
).replace(/\/$/, '')

const siteUrlPlugin = {
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // La demo (npm run build:demo → modo "demo") se publica como página única: rutas relativas
  base: mode === 'demo' ? './' : '/',
  plugins: [react(), siteUrlPlugin],
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/share': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  }
}))
