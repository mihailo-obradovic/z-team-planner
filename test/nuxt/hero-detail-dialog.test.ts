import { afterEach, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, nextTick } from 'vue';

import HeroDetailDialog from '@/components/HeroDetailDialog.vue';

import type { HeroId } from '@/types/hero';

// * Coverage for catalyst/features/011_hero-detail-dialog.md. The rules under test are the ones the dialog itself owns — the roster's order, switching without closing, the pair totals, and the fixed-level hero — not feature 003's budgets, which have their own tests.

async function planner() {
  let instance!: ReturnType<typeof useHeroPlanner>;

  await mountSuspended(
    defineComponent({
      setup() {
        instance = useHeroPlanner();

        return () => h('div');
      }
    })
  );

  return instance;
}

// ! The dialog teleports to the body, and a teleport is not removed by unmounting alone — without clearing it between cases every assertion also sees the previous test's dialog.
let open: Awaited<ReturnType<typeof mountSuspended>> | null = null;

afterEach(() => {
  open?.unmount();
  open = null;
  document.body.innerHTML = '';
});

async function openDialog(heroId: HeroId) {
  open = await mountSuspended(HeroDetailDialog, { props: { heroId } });

  return open;
}

function dialogText() {
  return document.body.textContent?.replace(/\s+/g, ' ') ?? '';
}

function rosterNames() {
  const rail = document.querySelector('nav[aria-label="Roster"]');

  return [...(rail?.querySelectorAll('img') ?? [])].map((img) => img.alt);
}

describe('hero detail dialog', () => {
  it('lists the roster the way the overview grid draws it', async () => {
    const p = await planner();
    await openDialog('golem');
    await nextTick();

    const expected = p.synergyPairColumns.value.flatMap((column) => [
      column.top.name,
      column.bottom.name
    ]);

    expect(rosterNames()).toEqual(expected);
  });

  it('marks the open hero in the roster and no one else', async () => {
    await openDialog('golem');
    await nextTick();

    const rail = document.querySelector('nav[aria-label="Roster"]');
    const marked = [...(rail?.querySelectorAll('[aria-current="true"]') ?? [])];

    expect(marked).toHaveLength(1);
    expect(marked[0]?.getAttribute('aria-label')).toBe('Golem');
  });

  it('asks its caller to switch hero rather than closing', async () => {
    const dialog = await openDialog('golem');
    await nextTick();

    const partner = [...document.querySelectorAll('button')].find((button) =>
      /synergy partner/i.test(button.textContent ?? '')
    );

    partner?.click();
    await nextTick();

    expect(dialog.emitted('select')).toBeTruthy();
    expect(dialog.emitted('close')).toBeFalsy();
  });

  it('shows the pair total as both heroes combined', async () => {
    const p = await planner();

    p.statUp('golem', 'combat');

    const dialog = await openDialog('golem');
    await nextTick();

    const partner = p.synergyPairColumns.value
      .flatMap((column) => [column, column])
      .map((column) =>
        column.top.id === 'golem'
          ? column.bottom
          : column.bottom.id === 'golem'
            ? column.top
            : null
      )
      .find(Boolean);

    expect(partner).toBeTruthy();

    const golem = p.heroes.value.find((hero) => hero.id === 'golem')!;
    const other = p.heroes.value.find((hero) => hero.id === partner!.id)!;

    const combined =
      golem.startingStats.combat +
      p.getStatAllocations('golem').combat +
      p.getSpecialPowerBonusStats('golem').combat +
      other.startingStats.combat +
      p.getStatAllocations(other.id).combat +
      p.getSpecialPowerBonusStats(other.id).combat;

    expect(dialogText()).toContain('Pair total');
    expect(dialogText()).toContain(String(combined));
    expect(dialog.emitted('close')).toBeFalsy();
  });

  it('offers no partner control for a hero without one', async () => {
    const p = await planner();

    // ! Blonde Blazer only exists on the roster once the recruits are shown, and she has no synergy pair — the case the control has to disappear for.
    p.showEp8Recruits.value = true;
    await nextTick();

    await openDialog('blonde-blazer');
    await nextTick();

    expect(dialogText()).not.toContain('Synergy partner');
    expect(dialogText()).not.toContain('Pair total');
  });

  it('renders no steppers for a fixed-level hero', async () => {
    const p = await planner();

    p.showEp8Recruits.value = true;
    await nextTick();

    await openDialog('blonde-blazer');
    await nextTick();

    const steppers = [...document.querySelectorAll('button')].filter((button) =>
      /(Add|Remove) a \w+ point/.test(button.getAttribute('aria-label') ?? '')
    );

    expect(steppers).toHaveLength(0);
  });

  it('renders the hero note then every true advisory, warnings before suggestions', async () => {
    const p = await planner();

    p.resetAllTrainings();
    p.resetHero('golem');
    p.resetHero('flambae');

    p.statUp('golem', 'combat');
    p.statUp('golem', 'combat');
    p.statUp('flambae', 'combat');
    p.statUp('flambae', 'combat');
    p.statUp('flambae', 'combat');
    // * Golem's synergy partner (Invisigal) has 1 base Charisma, so the pair total lands
    // * exactly at 10 here rather than over it — this exercises advisory 5 in isolation
    // * from advisory 3, which has its own boundary coverage in hero-notes.test.ts.
    for (let i = 0; i < 7; i++) {
      p.statUp('golem', 'charisma');
    }
    p.toggleStartingPower('golem');
    p.toggleTrainablePower('golem', 1); // * Spread Thin

    await openDialog('golem');
    await nextTick();

    const notes = document.querySelector('[aria-label="Notes"]');
    const lines = [...(notes?.querySelectorAll('li') ?? [])].map(
      (line) => line.textContent
    );

    expect(lines[0]).toContain('breadth rather than any single peak');
    expect(lines[1]).toContain('least required stat');
    expect(lines[2]).toContain('Spread Thin alone reaches the cap on Charisma');
    expect(lines[3]).toContain('strong spare-point recipient');
    expect(lines[4]).toContain('solo multi-slot calls effectively');
    expect(lines).toHaveLength(5);
  });

  it('keeps the notes panel structurally identical whether or not advisories fire', async () => {
    await openDialog('prism');
    await nextTick();

    const empty = document
      .querySelector('[aria-label="Notes"]')!
      .parentElement!.getAttribute('class');

    open?.unmount();
    document.body.innerHTML = '';

    const p = await planner();

    p.resetAllTrainings();
    p.resetHero('golem');
    p.resetHero('flambae');

    p.statUp('golem', 'combat');
    p.statUp('golem', 'combat');
    p.statUp('flambae', 'combat');
    p.statUp('flambae', 'combat');
    p.statUp('flambae', 'combat');

    await openDialog('golem');
    await nextTick();

    const withAdvisories = document
      .querySelector('[aria-label="Notes"]')!
      .parentElement!.getAttribute('class');

    expect(withAdvisories).toBe(empty);
  });

  it("resolves a hero's active partner, not a cut hero's stale base pair", async () => {
    const p = await planner();

    p.resetAllTrainings();
    p.resetHero('malevola');
    p.resetHero('waterboy');

    // ! Sonar is the default episode-3 cut and Waterboy the default episode-4 hire, so
    // ! BASE_SYNERGY_PAIRS still carries malevola-sonar (stale — Sonar isn't on the visible
    // ! roster) alongside the conditional malevola-waterboy pair that actually applies. A
    // ! partner lookup over the raw pair list can match the stale one first; this pins the
    // ! bug that shipped: it reported Malevola's Charisma pair total as over 10 against
    // ! Sonar's base 3, when her real partner Waterboy leaves it at exactly 10.
    for (let i = 0; i < 6; i++) {
      p.statUp('malevola', 'charisma');
    }

    await openDialog('malevola');
    await nextTick();

    const notes = document.querySelector('[aria-label="Notes"]');
    const lines = [...(notes?.querySelectorAll('li') ?? [])].map(
      (line) => line.textContent
    );

    expect(dialogText()).toContain('Synergy partner: Waterboy');
    expect(dialogText()).toContain('Pair total');
    expect(lines.some((line) => line?.includes('Charisma'))).toBe(false);
  });
});
