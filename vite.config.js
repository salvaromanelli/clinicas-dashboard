import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// Recrear __dirname en ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Add these two lines
  base: '/',
  publicDir: 'public',
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      'src': path.resolve(__dirname, 'src')
    }
  },
  server: {
    hmr: {
      overlay: false
    }
  }
})