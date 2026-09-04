import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { HEROES } from '@/types/hero';
import { heroPortraitSrc } from '@/utils/heroPortraitSrc';

import type { SonarForm } from '@/utils/heroPortraitSrc';

// * Feature 021: one lossless 512×512 master per portrait. The file is what Vercel resizes from, so a lossy or off-size master would be encoded twice or upscaled.
const MASTER_SIZE = 512;

const PUBLIC_DIR = join(import.meta.dirname, '../../public');

const FORMS: SonarForm[] = ['hybrid', 'monster'];

const portraitPaths = HEROES.flatMap((hero) =>
  hero.id === 'sonar'
    ? FORMS.map((form) => heroPortraitSrc(hero.id, form))
    : [heroPortraitSrc(hero.id, 'hybrid')]
);

// * WebP container: RIFF header, then one chunk; a lossless file's first chunk is VP8L, whose 5th byte onward packs width-1 and height-1 as 14-bit fields.
function readWebpMaster(path: string) {
  const bytes = readFileSync(join(PUBLIC_DIR, path));
  const riff = bytes.toString('ascii', 0, 4);
  const webp = bytes.toString('ascii', 8, 12);
  const chunk = bytes.toString('ascii', 12, 16);
  const bits = bytes.readUInt32LE(21);
  return {
    isWebp: riff === 'RIFF' && webp === 'WEBP',
    chunk,
    width: (bits & 0x3fff) + 1,
    height: ((bits >> 14) & 0x3fff) + 1
  };
}

describe('portrait masters', () => {
  it("covers every hero, and both of Sonar's forms", () => {
    expect(portraitPaths).toHaveLength(HEROES.length + 1);
    expect(new Set(portraitPaths).size).toBe(portraitPaths.length);
  });

  it.each(portraitPaths)('%s is a lossless 512×512 WebP', (path) => {
    const master = readWebpMaster(path);
    expect(master.isWebp).toBe(true);
    expect(master.chunk).toBe('VP8L');
    expect(master.width).toBe(MASTER_SIZE);
    expect(master.height).toBe(MASTER_SIZE);
  });
});
