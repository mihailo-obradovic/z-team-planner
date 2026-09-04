import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';

import PrivacyPage from '@/pages/privacy.vue';

describe('the privacy page', () => {
  it('names the controller and a private contact address', async () => {
    const page = await mountSuspended(PrivacyPage);

    expect(page.text()).toContain('Mihailo Obradović');
    expect(page.find('a[href="mailto:mihailo.obradovic@pm.me"]').exists()).toBe(
      true
    );
  });

  it('lists every localStorage key the app writes', async () => {
    const page = await mountSuspended(PrivacyPage);

    for (const key of [
      'z-team-builds',
      'z-team-active-build',
      'z-team-import-offer-seen',
      'z-team-spoiler-acknowledged',
      'z-team-storage-notice-acknowledged'
    ]) {
      expect(page.text()).toContain(key);
    }
  });

  // ! Never "deleted immediately" alone: feature 004's retention keeps a deleted row in the encrypted backups for 30 days.
  it('states the backup window and the deletion path', async () => {
    const page = await mountSuspended(PrivacyPage);

    expect(page.text()).toContain('up to 30 days');
    expect(page.text()).toContain('Delete account');
  });

  it('carries a last-updated date', async () => {
    const page = await mountSuspended(PrivacyPage);

    expect(page.text()).toMatch(/Last updated \d{1,2} \w+ \d{4}/);
  });

  it('has one way back, to the planner', async () => {
    const page = await mountSuspended(PrivacyPage);

    expect(page.find('a[href="/"]').text()).toContain('Back to the planner');
  });
});
