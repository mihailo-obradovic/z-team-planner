import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { defineVitestProject } from '@nuxt/test-utils/config';

export default defineConfig({
  test: {
    projects: [
      // * Nuxt runtime tests
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
          // * Default: 5000. @nuxt/test-utils 4 starts Nuxt lazily, so a file's first mount now pays the app's warm-up inside the test (about 1.3s idle under coverage, against 0.25s on 3.x) and crossed 5s under load (decision 015).
          testTimeout: 15_000,
          environmentOptions: {
            nuxt: {
              rootDir: fileURLToPath(new URL('.', import.meta.url))
            }
          }
        }
      }),
      // * Plain Node unit tests (no DOM)
      {
        resolve: {
          alias: {
            '@': fileURLToPath(new URL('./web', import.meta.url))
          }
        },
        test: {
          name: 'unit',
          include: ['test/unit/*.{test,spec}.ts'],
          environment: 'node'
        }
      }
    ]
  }
});
