import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  define: {
    'import.meta.env.VITE_YOUTUBE_API_KEY': JSON.stringify(process.env.YOUTUBE_API_KEY || '')
  }
})
