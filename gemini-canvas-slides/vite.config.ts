import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages用のbase設定(本番環境)、ローカル開発時は './'
  base: process.env.NODE_ENV === 'production' ? '/claude-code-playground/' : './',
  server: {
    port: 5174,
  },
})
