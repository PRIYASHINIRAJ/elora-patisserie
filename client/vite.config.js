import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Uploaded images/videos are stored and served by the API as relative
    // `/uploads/...` URLs. Without this proxy, the dev server (port 5173)
    // would try to resolve them itself and silently fall back to serving
    // index.html instead of the actual file.
    proxy: {
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
