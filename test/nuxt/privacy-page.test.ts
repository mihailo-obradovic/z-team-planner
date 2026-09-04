import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';

import PrivacyPage from '@/pages/privacy.vue';

describe('the privacy page', () => {
  // * The maintainer chose to stay unnamed; the issues page is the whole contact.
  it('names a single maintainer, no person, and links the GitHub issues page', async () => {
    const page = await mountSuspended(PrivacyPage);
    const issues = page.find(
      'a[href="https://github.com/mihailo-obradovic/z-team-planner/issues"]'
    );

    expect(page.text()).toContain('by a single maintainer');
    expect(page.text()).not.toContain('Mihailo');
    expect(issues.exists()).toBe(true);
    expect(issues.attributes('rel')).toBe('noopener');
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

  it('credits AdHoc Studio and calls itself a non-profit fan project', async () => {
    const page = await mountSuspended(PrivacyPage);

    expect(page.text()).toContain('non-profit');
    expect(page.text()).toContain('property of AdHoc Studio');
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
