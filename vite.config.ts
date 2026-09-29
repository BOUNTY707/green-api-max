import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // relative paths: the build works on GitHub Pages, Netlify, Vercel or any static host
  base: './',
});
