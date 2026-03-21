import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    // En desarrollo, redirige /api/* a vercel dev (puerto 3000)
    // Así podés correr "npm run dev" + "vercel dev" en paralelo,
    // o simplemente usar solo "vercel dev" que levanta ambos.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
