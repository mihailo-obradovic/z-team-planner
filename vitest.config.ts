import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { defineVitestProject } from '@nuxt/test-utils/config';

export default defineConfig({
  test: {
    projects: [
      {
        // * The unit project runs outside Nuxt, so it needs the srcDir alias spelled out;
        // * inside the nuxt project Nuxt resolves @/ itself.
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
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: {
              rootDir: fileURLToPath(new URL('.', import.meta.url))
            }
          }
        }
      })
    ]
  }
});
