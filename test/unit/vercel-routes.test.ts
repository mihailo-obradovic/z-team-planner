import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// * Decision 014: routing into a service is final, so a rewrite that claims a path Nuxt serves breaks it with the API's 404. Nuxt modules own server routes under `/api/` too (Nuxt Icon's `/api/_nuxt_icon/…`), so the API gets only its own prefix and the two health checks.

type Rewrite = { source: string; destination: { service: string } };

const { rewrites } = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../vercel.json'), 'utf8')
) as { rewrites: Rewrite[] };

// * The sources here use only literal segments and `(.*)`; anything else should fail loudly rather than be half-understood.
function sourcePattern(source: string): RegExp {
  if (/[:*+?{}[\]]/.test(source.replaceAll('(.*)', ''))) {
    throw new Error(`unsupported rewrite source: ${source}`);
  }
  const escaped = source
    .split('(.*)')
    .map((part) => part.replace(/[.^$|\\/]/g, '\\$&'))
    .join('(.*)');

  return new RegExp(`^${escaped}$`);
}

function serviceFor(path: string): string | undefined {
  return rewrites.find(({ source }) => sourcePattern(source).test(path))
    ?.destination.service;
}

describe('vercel.json rewrites', () => {
  it.each([
    ['/api/v1/me', 'api'],
    ['/api/v1/builds', 'api'],
    ['/api/v1/shared/0b5f6c1e', 'api'],
    ['/healthz', 'api'],
    ['/readyz', 'api'],
    ['/api/_nuxt_icon/lucide.json', 'web'],
    ['/metrics', 'web'],
    ['/', 'web'],
    ['/b/0b5f6c1e', 'web']
  ])('send %s to %s', (path, service) => {
    expect(serviceFor(path)).toBe(service);
  });
});
