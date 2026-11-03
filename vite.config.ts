import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  // The light site is standalone. Vite copies it to the root of the build.
  publicDir: 'v2',
  plugins: [react(), tailwindcss()],
  build: { rollupOptions: { input: 'classic.html' } },
})
