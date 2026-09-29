import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The in-browser API (src/backend) uses Express-style route files;
      // this small router stands in for Express.
      express: fileURLToPath(new URL('./src/backend/express.js', import.meta.url)),
    },
  },
})
