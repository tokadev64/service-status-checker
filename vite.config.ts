import vue from 'npm:@vitejs/plugin-vue@^6.0.1';
import { defineConfig } from 'npm:vite@^7.1.5';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  build: {
    outDir: 'dist',
  },
});
