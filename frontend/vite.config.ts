/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const filesNeedToExclude = ['src/assets/DeskSpacerPreAlphaDemo.gif'];
const filesPathToExclude = filesNeedToExclude.map(src => {
  return fileURLToPath(new URL(src, import.meta.url));
});

// https://vite.dev/config/
export default defineConfig(async () => {
  const testProjects = [];

  // Only load Storybook test plugin when running tests
  // This prevents Node.js version issues during production builds
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    const { storybookTest } = await import('@storybook/addon-vitest/vitest-plugin');
    testProjects.push({
      extends: true,
      plugins: [
        // The plugin will run tests for the stories defined in your Storybook config
        // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
        storybookTest({
          configDir: path.join(dirname, '.storybook')
        })
      ],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: 'playwright',
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.ts']
      }
    });
  }

  return {
    plugins: [react(), svgr()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.ts',
      projects: testProjects
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext'
      }
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        external: [...filesPathToExclude]
      }
    },
    resolve: {
      dedupe: ['three']
    }
  };
});