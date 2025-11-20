import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages用のbase設定（プロジェクトサイトの場合）
  base: process.env.NODE_ENV === 'production' ? '/claude-code-playground/' : './',
  server: {
    port: 5174,
  },
})
