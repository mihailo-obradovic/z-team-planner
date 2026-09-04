import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';

import PrivacyLink from '@/components/_shared/PrivacyLink.vue';

// * Placement — last in each planner tab and after the shared build — is walked in a browser (feature 010, Verification): the planner page is not mounted in tests, and a page-level Pinia Colada query never resolves under mountSuspended (shared-build.test.ts).
describe('PrivacyLink', () => {
  it('is a single link to /privacy', async () => {
    const line = await mountSuspended(PrivacyLink);
    const links = line.findAll('a');

    expect(links).toHaveLength(1);
    expect(links[0]?.attributes('href')).toBe('/privacy');
    expect(links[0]?.text()).toBe('Privacy');
  });
});
