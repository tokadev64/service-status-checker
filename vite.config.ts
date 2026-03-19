import vue from 'npm:@vitejs/plugin-vue@^6.0.1';
import { defineConfig } from 'npm:vite@^7.1.5';
import tailwindcss from '@tailwindcss/vite';

const repositoryName = Deno.env.get('GITHUB_REPOSITORY')?.split('/')[1];
const base =
  Deno.env.get('GITHUB_ACTIONS') === 'true' && repositoryName
    ? `/${repositoryName}/`
    : '/';

export default defineConfig({
  base,
  plugins: [tailwindcss(), vue()],
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
