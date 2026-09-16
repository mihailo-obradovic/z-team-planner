// * Assembles the simulator's three concerns into the one surface the planner spreads: the team's slots, the templates, and the score read from both (feature 015).
export function useMissionSimulator(
  episodeSetup: ReturnType<typeof useHeroEpisodeSetup>,
  levelUp: ReturnType<typeof useHeroLevelUp>,
  powerTraining: ReturnType<typeof useHeroPowerTraining>
) {
  const team = useMissionTeam(episodeSetup, powerTraining);
  const templates = useMissionTemplates();
  const score = useMissionScore(team, templates, levelUp, powerTraining);

  return {
    missionSlots: team.missionSlots,
    missionCandidates: team.missionCandidates,
    missionTeamHasPair: team.missionTeamHasPair,
    missionIllusionSource: team.missionIllusionSource,
    fillMissionSlot: team.fillMissionSlot,
    removeMissionSlot: team.removeMissionSlot,
    moveMissionSlot: team.moveMissionSlot,
    ...templates,
    ...score
  };
}
