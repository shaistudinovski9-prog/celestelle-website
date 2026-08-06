import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Dev: forward API calls to the Express server.
      '/api': 'http://localhost:4000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
