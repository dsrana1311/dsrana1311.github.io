import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes the build work on GitHub Pages under any repo name,
// as well as on Netlify/Vercel or a custom domain, without edits.
export default defineConfig({
  plugins: [react()],
  base: './',
})
