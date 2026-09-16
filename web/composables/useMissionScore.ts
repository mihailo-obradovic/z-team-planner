import { HERO_STARTING_STATS, STAT_NAMES } from '@/types/hero';
import { ILLUSION_SLOT } from '@/types/mission';

import {
  enPointe,
  illusion,
  scoreMission,
  spreadThin,
  teamTotals,
  xpFulfilled
} from '@/utils/missionScore';
import { isHeroSlot } from '@/utils/missionTeam';

import type { HeroId, HeroStats, SynergyLevel } from '@/types/hero';
import type { IllusionRatio, SlotPowerTraining } from '@/types/mission';

// * En Pointe and Spread Thin come from the real team, ignoring the other tabs' what-if chips; Supernova and Sonar's form flow in through the shared effective stats.
export function useMissionScore(
  team: ReturnType<typeof useMissionTeam>,
  templates: ReturnType<typeof useMissionTemplates>,
  levelUp: ReturnType<typeof useHeroLevelUp>,
  powerTraining: ReturnType<typeof useHeroPowerTraining>
) {
  const { missionSynergyLevel } = usePlannerState();

  const missionIllusionRatio = computed<IllusionRatio>(() =>
    training('prism', 1) === 'trained' ? 1 : 0.5
  );

  const slotStats = computed<(HeroStats | null)[]>(() => {
    const slots = team.missionSlots.value;
    const heroStats = slots.map((slot, index) =>
      isHeroSlot(slot) ? heroSlotStats(slot, index) : null
    );

    return slots.map((slot, index) => {
      if (slot !== ILLUSION_SLOT) {
        // * A copy is Golem's own expansion — its value is already in his boosted row.
        return heroStats[index] ?? null;
      }

      const sourceStats = heroStats[slots.indexOf('prism') - 1];

      return sourceStats
        ? illusion(sourceStats, missionIllusionRatio.value)
        : null;
    });
  });

  const missionTeamTotals = computed(() => teamTotals(slotStats.value));

  // * Talk Shit works only in Hybrid form, which is the shared monster toggle being off (feature 012).
  const missionReattempters = computed<HeroId[]>(() => {
    const onTeam = team.missionHeroIds.value;
    const reattempters: HeroId[] = [];

    if (onTeam.has('coupe') && training('coupe', 1) === 'trained') {
      reattempters.push('coupe');
    }

    if (
      onTeam.has('sonar') &&
      training('sonar', 2) === 'trained' &&
      !powerTraining.monsterForm.value
    ) {
      reattempters.push('sonar');
    }

    return reattempters;
  });

  const missionSuccess = computed(() =>
    scoreMission({
      totals: missionTeamTotals.value,
      template: templates.missionActiveTemplateData.value,
      synergyLevel: missionSynergyLevel.value,
      teamHasPair: team.missionTeamHasPair.value,
      reattempters: missionReattempters.value
    })
  );

  const missionXpFulfilled = computed(() =>
    xpFulfilled(
      missionTeamTotals.value,
      templates.missionActiveTemplateData.value
    )
  );

  function setMissionSynergyLevel(level: SynergyLevel) {
    if ([0, 1, 2, 3].includes(level)) {
      missionSynergyLevel.value = level;
    }
  }

  function heroSlotStats(id: HeroId, index: number): HeroStats {
    if (id === 'coupe') {
      return powerTraining.getEffectiveStatsWithBonuses(
        id,
        enPointe(index, training('coupe', 2))
      );
    }

    if (id === 'golem') {
      const allocations = levelUp.getStatAllocations(id);
      const ownStats = Object.fromEntries(
        STAT_NAMES.map((stat) => [
          stat,
          HERO_STARTING_STATS.golem[stat] + allocations[stat]
        ])
      ) as HeroStats;

      return powerTraining.getEffectiveStatsWithBonuses(
        id,
        spreadThin(ownStats, team.missionCopyCount.value)
      );
    }

    return powerTraining.getEffectiveStatsWithBonuses(
      id,
      powerTraining.getSpecialPowerBonusStats(id)
    );
  }

  function training(id: HeroId, trainable: 1 | 2): SlotPowerTraining {
    return powerTraining.getPowerState(id).trainableSelected === trainable
      ? 'trained'
      : 'untrained';
  }

  return {
    missionSynergyLevel,
    missionTeamTotals,
    missionIllusionRatio,
    missionSuccess,
    missionXpFulfilled,
    setMissionSynergyLevel
  };
}
