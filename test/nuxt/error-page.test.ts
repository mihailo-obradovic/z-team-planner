import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const clearErrorSpy = vi.fn<(options?: { redirect?: string }) => void>();

mockNuxtImport('clearError', () => (options?: { redirect?: string }) => {
  clearErrorSpy(options);
});

const ErrorPage = (await import('@/error.vue')).default;

// * Built with the real factory rather than a cast: the component's prop is a NuxtError, and a literal standing in for one would only prove the cast compiles.
async function mountWith(input: {
  statusCode?: number;
  statusMessage?: string;
  data?: { heading?: string };
}) {
  return await mountSuspended(ErrorPage, {
    props: { error: createError(input) }
  });
}

describe('the error page', () => {
  beforeEach(() => {
    clearErrorSpy.mockReset();
  });

  it("uses the caller's opted-in heading", async () => {
    const page = await mountWith({
      statusCode: 404,
      data: { heading: 'Build not found' }
    });

    expect(page.find('h1').text()).toBe('Build not found');
    expect(page.text()).toContain('404');
  });

  it('falls back to "Page not found" on a 404 that opted into no heading', async () => {
    const page = await mountWith({ statusCode: 404 });

    expect(page.find('h1').text()).toBe('Page not found');
  });

  // ! Nuxt sets statusMessage itself on an unmatched route, as `Page not found: <path>`. Reading it would reflect the requested path into the heading.
  it('ignores statusMessage, so an unmatched route cannot put its path in the heading', async () => {
    const page = await mountWith({
      statusCode: 404,
      statusMessage: 'Page not found: /nonsense'
    });

    expect(page.find('h1').text()).toBe('Page not found');
    expect(page.text()).not.toContain('/nonsense');
  });

  it('uses the generic wording for a 500', async () => {
    const page = await mountWith({ statusCode: 500 });

    expect(page.find('h1').text()).toBe('Something went wrong');
    expect(page.text()).toContain('500');
  });

  it('renders no code and the generic wording when there is no status', async () => {
    const page = await mountWith({});

    expect(page.find('h1').text()).toBe('Something went wrong');
    expect(page.text()).not.toContain('undefined');
  });

  // * The defect the browser walk found on Nuxt's default page: statusMessage rendered as both the heading and the body.
  it('never repeats the heading as the supporting line', async () => {
    for (const error of [
      { statusCode: 404, data: { heading: 'Build not found' } },
      { statusCode: 404 },
      { statusCode: 500 },
      {}
    ]) {
      const page = await mountWith(error);
      const heading = page.find('h1').text();
      const paragraphs = page.findAll('p').map((node) => node.text());

      expect(paragraphs).not.toContain(heading);
    }
  });

  it('goes back to the planner through clearError', async () => {
    const page = await mountWith({ statusCode: 404 });

    await page.find('button').trigger('click');

    expect(clearErrorSpy).toHaveBeenCalledWith({ redirect: '/' });
  });
});
