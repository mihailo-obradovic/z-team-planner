import { MAX_BONUS_POINTS, MAX_STAT_VALUE, STAT_NAMES } from '@/types/hero';

import {
  evaluateAdvisories,
  getHeroNote,
  type AdvisoryLine,
  type PairStat
} from '@/utils/heroNotes';

import type { HeroId } from '@/types/hero';

// * Coverage for catalyst/features/022_hero-notes.md. Reduces live planner state to the
// * plain HeroNoteContext heroNotes.ts's pure evaluator reads — the panel's rendering and
// * ordering live in HeroDetailDialog.vue, this composable only supplies the two lists.
export function useHeroNotes(heroId: MaybeRefOrGetter<HeroId | null>) {
  const {
    heroes,
    getStatAllocations,
    getPowerState,
    getBonusLevel,
    bonusLevelsUsed,
    getPairCombinedStats,
    synergyPairColumns,
    ep8RecruitIds
  } = useHeroPlanner();

  const id = computed(() => toValue(heroId));

  // * Mirrors HeroDetailDialog's own synergyPartner: synergyPairColumns is already resolved
  // * against the visible roster, unlike the raw synergyPairs tuples, which still carry a
  // * cut hero's base pair (e.g. Malevola-Sonar) alongside the conditional replacement that
  // * actually applies — reading the raw list here once picked the wrong, stale partner.
  const partnerId = computed<HeroId | null>(() => {
    if (!id.value) {
      return null;
    }

    for (const column of synergyPairColumns.value) {
      if (column.top.id === id.value) {
        return column.bottom.id;
      }

      if (column.bottom.id === id.value) {
        return column.top.id;
      }
    }

    return null;
  });

  const isEp8Waterboy = computed(() => ep8RecruitIds.value.has('waterboy'));

  const note = computed(() =>
    id.value ? getHeroNote(id.value, isEp8Waterboy.value) : null
  );

  const pairStats = computed<PairStat[]>(() => {
    if (!id.value || !partnerId.value) {
      return [];
    }

    const combined = getPairCombinedStats(id.value, partnerId.value);
    const own = getStatAllocations(id.value);
    const partnerAllocations = getStatAllocations(partnerId.value);

    return STAT_NAMES.map((stat) => ({
      stat,
      pairTotal: combined[stat],
      allocatedInPair: own[stat] + partnerAllocations[stat]
    }));
  });

  const alaSecondeReady = computed(() => {
    if (!id.value || !partnerId.value) {
      return false;
    }

    const isCoupePunchUpPair =
      (id.value === 'coupe' && partnerId.value === 'punch-up') ||
      (id.value === 'punch-up' && partnerId.value === 'coupe');

    if (!isCoupePunchUpPair) {
      return false;
    }

    if (getPowerState('coupe').trainableSelected !== 2) {
      return false;
    }

    const combined = getPairCombinedStats('coupe', 'punch-up');
    const statsAtTen = STAT_NAMES.filter(
      (stat) => combined[stat] >= MAX_STAT_VALUE
    ).length;

    return statsAtTen < 4;
  });

  const advisories = computed<AdvisoryLine[]>(() => {
    if (!id.value) {
      return [];
    }

    const hero = heroes.value?.find((h) => h.id === id.value);

    if (!hero) {
      return [];
    }

    const ownAllocations = getStatAllocations(id.value);
    const flambaeAllocations = getStatAllocations('flambae');

    const rosterAllocatedCombat = (heroes.value ?? []).reduce(
      (sum, h) => sum + getStatAllocations(h.id).combat,
      0
    );

    return evaluateAdvisories({
      heroId: id.value,
      rawStats: Object.fromEntries(
        STAT_NAMES.map((stat) => [
          stat,
          hero.startingStats[stat] + ownAllocations[stat]
        ])
      ) as (typeof hero)['startingStats'],
      rosterAllocatedCombat,
      ownAllocatedCombat: ownAllocations.combat,
      supernovaTrained: getPowerState('flambae').trainableSelected === 2,
      supernovaAllocated:
        flambaeAllocations.combat > 0 || flambaeAllocations.mobility > 0,
      spreadThinTrained: getPowerState('golem').trainableSelected === 1,
      wolfPackSelected: getPowerState('invisigal').trainableSelected === 2,
      harderHeadSelected: getPowerState('punch-up').trainableSelected === 2,
      golemBonusAvailable:
        getBonusLevel('golem') === 0 &&
        bonusLevelsUsed.value < MAX_BONUS_POINTS,
      alaSecondeReady: alaSecondeReady.value,
      pairStats: pairStats.value
    });
  });

  return {
    note,
    advisories
  };
}
