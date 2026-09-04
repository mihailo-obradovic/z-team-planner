import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  PORTRAIT_DENSITIES,
  PORTRAIT_MASTER,
  PORTRAIT_WIDTHS,
  portraitScreens
} from '@/config/portraits';

// * Feature 021, Invariants: nothing requests more than the master holds, `image.screens` is exactly what the usage sites request — on Vercel that list is the optimizer's allowed sizes — and every portrait renders through `HeroPortrait`, the one place a width is declared.

const WEB_DIR = join(import.meta.dirname, '../../web');

function vueFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return vueFiles(path);
    }

    return entry.name.endsWith('.vue') ? [path] : [];
  });
}

describe('portrait widths', () => {
  it('never exceed the master at any density', () => {
    for (const width of Object.values(PORTRAIT_WIDTHS)) {
      for (const density of PORTRAIT_DENSITIES) {
        expect(width * density).toBeLessThanOrEqual(PORTRAIT_MASTER);
      }
    }
  });

  it('derive the screens list exactly — every width × density, nothing else', () => {
    const expected = new Set(
      Object.values(PORTRAIT_WIDTHS).flatMap((width) =>
        PORTRAIT_DENSITIES.map((density) => width * density)
      )
    );
    const screens = portraitScreens();

    expect(new Set(Object.values(screens))).toEqual(expected);
    expect(Object.values(screens)).toEqual(
      Object.values(screens).sort((a, b) => a - b)
    );
    for (const [key, width] of Object.entries(screens)) {
      expect(key).toBe(`portrait-${width}`);
    }
  });

  it('are declared only by HeroPortrait — no other component renders a portrait', () => {
    const offenders = vueFiles(WEB_DIR).filter((path) => {
      if (path.endsWith('HeroPortrait.vue')) {
        return false;
      }
      const source = readFileSync(path, 'utf8');

      return /heroPortraitSrc|portraitSrc/.test(source);
    });

    expect(offenders).toEqual([]);
  });
});
