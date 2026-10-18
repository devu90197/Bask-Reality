import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API server (server/index.js) runs on 5174; Vite forwards /api to it.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    open: true,
    proxy: { '/api': { target: 'http://localhost:5174', changeOrigin: true } },
  },
});
