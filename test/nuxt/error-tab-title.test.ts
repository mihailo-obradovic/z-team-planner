import { injectHead } from '@unhead/vue';
import { resolveTags } from '@unhead/vue/utils';
import { afterEach, describe, expect, it } from 'vitest';

import type { ErrorPageData } from '@/types/errorPage';

// * Read from the head manager rather than the DOM: the title is what every entry resolves to, and the browser walk proves it reaches the tab.
async function titleFor(input: {
  statusCode?: number;
  statusMessage?: string;
  message?: string;
  data?: ErrorPageData;
}) {
  const head = injectHead();

  showError(createError(input));
  await nextTick();

  return resolveTags(head).find((tag) => tag.tag === 'title')?.textContent;
}

describe('the error tab title', () => {
  afterEach(async () => {
    await clearError();
  });

  it("names the caller's opted-in heading", async () => {
    expect(
      await titleFor({ statusCode: 404, data: { heading: 'Build not found' } })
    ).toBe('Build not found — Z-Team Planner');
  });

  // ! Nuxt writes `Page not found: <path>` as the message of an unmatched route.
  it('keeps the requested path out of an unmatched route', async () => {
    const title = await titleFor({
      statusCode: 404,
      statusMessage: 'Page not found: /nonsense'
    });

    expect(title).toBe('Page not found — Z-Team Planner');
    expect(title).not.toContain('/nonsense');
  });

  it('shows no code for a read that never reached a server', async () => {
    expect(await titleFor({ data: { status: 'unknown' } })).toBe(
      'Something went wrong — Z-Team Planner'
    );
  });

  it('uses the generic heading for a 500', async () => {
    expect(await titleFor({ statusCode: 500 })).toBe(
      'Something went wrong — Z-Team Planner'
    );
  });

  // ! SEO Utils' fallback title-cased the last path segment for any status but 404 and 500, which on `/b/<id>` is the build id.
  it('uses the generic heading for a 503', async () => {
    expect(await titleFor({ statusCode: 503 })).toBe(
      'Something went wrong — Z-Team Planner'
    );
  });
});
