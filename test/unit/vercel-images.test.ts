import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { beforeAll, describe, expect, it, vi } from 'vitest';

// * Decision 014: in a Services deployment Vercel keeps only the top-level `images` of vercel.json and drops the block Nuxt emits from the web service's build. vercel.json therefore restates it, and this test holds it to nuxt.config.ts, which stays the source (feature 021).

const ROOT = join(import.meta.dirname, '../..');

type NuxtImageConfig = {
  image: {
    screens: Record<string, number>;
    vercel: { minimumCacheTTL: number };
  };
};

type VercelImages = {
  sizes: number[];
  formats: string[];
  minimumCacheTTL: number;
};

let nuxtConfig: NuxtImageConfig;
let vercelImages: VercelImages | undefined;

beforeAll(async () => {
  // ! `defineNuxtConfig` is a Nuxt global; outside Nuxt the config module only needs it to hand its argument back.
  vi.stubGlobal('defineNuxtConfig', (config: unknown) => config);
  // ! By URL, not specifier: a static import would pull nuxt.config.ts into the app's type program, where that global is undeclared.
  const configUrl = pathToFileURL(join(ROOT, 'nuxt.config.ts')).href;
  nuxtConfig = (await import(/* @vite-ignore */ configUrl))
    .default as NuxtImageConfig;
  vercelImages = JSON.parse(
    readFileSync(join(ROOT, 'vercel.json'), 'utf8')
  ).images;
});

describe('vercel.json images', () => {
  it('exists, since Services ignores the block the web service emits', () => {
    expect(vercelImages).toBeDefined();
  });

  it('allows exactly the widths nuxt.config.ts requests, ascending', () => {
    const screens = [...new Set(Object.values(nuxtConfig.image.screens))].sort(
      (a, b) => a - b
    );

    expect(vercelImages?.sizes).toEqual(screens);
  });

  it('keeps the edge cache nuxt.config.ts sets', () => {
    expect(vercelImages?.minimumCacheTTL).toBe(
      nuxtConfig.image.vercel.minimumCacheTTL
    );
  });

  it('serves the two formats the Vercel provider emits', () => {
    expect(vercelImages?.formats).toEqual(['image/webp', 'image/avif']);
  });
});
