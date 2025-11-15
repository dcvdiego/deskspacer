import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { fileURLToPath } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';

const filesNeedToExclude = ['src/assets/DeskSpacerPreAlphaDemo.gif'];

const filesPathToExclude = filesNeedToExclude.map((src) => {
  return fileURLToPath(new URL(src, import.meta.url));
});
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
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
      output: {
        manualChunks: (id) => {
          // Split 3D models into separate chunks by category
          if (id.includes('src/components/models/')) {
            if (id.includes('/displays/')) return 'models-displays';
            if (id.includes('/desks/')) return 'models-desks';
            if (id.includes('/keyboards/')) return 'models-keyboards';
            if (id.includes('/mice/')) return 'models-mice';
            if (id.includes('/mousepads/')) return 'models-mousepads';
            if (id.includes('/rooms/')) return 'models-rooms';
            return 'models-other';
          }

          // Split Three.js into its own chunk (large library)
          if (id.includes('node_modules/three/')) {
            return 'three';
          }

          // Keep React Three Fiber ecosystem together to avoid circular deps
          if (
            id.includes('@react-three/fiber') ||
            id.includes('@react-three/drei') ||
            id.includes('@react-three/postprocessing')
          ) {
            return 'react-three';
          }

          // Keep MUI and its dependencies together
          if (
            id.includes('node_modules/@mui/') ||
            id.includes('node_modules/@emotion/')
          ) {
            return 'mui';
          }

          // Keep React, Apollo, and other core dependencies in vendor
          // This prevents module resolution issues
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },

  resolve: {
    dedupe: ['three'],
  },
});
