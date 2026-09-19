import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { MAIN_CONTENT_ID } from '@/types/header';

// * The skip link and the landmark it jumps to live in different files, so a rename that reaches only one of them would leave the link pointing at nothing.

const WEB_DIR = join(import.meta.dirname, '../../web');

function read(path: string): string {
  return readFileSync(join(WEB_DIR, path), 'utf8');
}

describe('skip link', () => {
  it('is the shell’s first element, and the landmark carries the id it targets', () => {
    const shell = read('app.vue');
    const link = read('components/shell/SkipLink.vue');

    expect(shell.indexOf('<SkipLink />')).toBeLessThan(
      shell.indexOf('<u-header')
    );
    expect(shell).toContain(':id="MAIN_CONTENT_ID"');
    expect(shell).toContain('tabindex="-1"');
    expect(link).toContain('`#${MAIN_CONTENT_ID}`');
    expect(MAIN_CONTENT_ID).toBe('main-content');
  });
});
