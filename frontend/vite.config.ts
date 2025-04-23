import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { fileURLToPath } from 'node:url';

const filesNeedToExclude = ['public/DeskSpacerPreAlphaDemo.gif'];

const filesPathToExclude = filesNeedToExclude.map((src) => {
  return fileURLToPath(new URL(src, import.meta.url));
});
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({ plugins: [['@swc/plugin-styled-components', {}]] }),
    svgr(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
  optimizeDeps: { esbuildOptions: { target: 'esnext' } },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: [...filesPathToExclude],
    },
  },

  resolve: {
    dedupe: ['three'],
  },
});
