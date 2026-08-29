import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

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

// * Every `class="…"` in the file, as its list of class tokens.
function classLists(source: string): string[][] {
  return [...source.matchAll(/class="([^"]*)"/g)].map((match) =>
    (match[1] ?? '').split(/\s+/).filter(Boolean)
  );
}

// ! `panel` is border and shadow only, on purpose: Nuxt UI's own surfaces (dialog, dropdown, toast) already paint `--ui-bg`, so the utility must not double-declare it. A hand-rolled div has no such background and needs `bg-default` — the pairing nothing enforces, and which `pages/b/[id].vue` once missed, leaving ink text on the dark ground.
describe('the panel utility', () => {
  it('is always paired with a background on hand-rolled elements', () => {
    const unpaired = vueFiles(WEB_DIR).flatMap((path) =>
      classLists(readFileSync(path, 'utf8'))
        .filter(
          (classes) =>
            classes.includes('panel') && !classes.includes('bg-default')
        )
        .map(
          (classes) => `${path.replace(WEB_DIR, 'web')}: ${classes.join(' ')}`
        )
    );

    expect(unpaired).toEqual([]);
  });
});
