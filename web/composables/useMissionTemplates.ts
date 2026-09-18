import { MAX_STAT_VALUE } from '@/types/hero';
import { MISSION_TEMPLATE_COUNT } from '@/types/mission';

import type { StatName } from '@/types/hero';
import type { MissionTemplate } from '@/types/mission';

type MissionThresholdEdit = {
  template: number;
  kind: 'xp' | 'fail';
  stat: StatName;
  value: number | null;
};

// * Every write is guarded: an out-of-range template, stat value or index is a silent no-op (feature 015).
export function useMissionTemplates() {
  const { missionTemplates, missionActiveTemplate } = usePlannerState();

  // * The index is kept in range by its setter and by deserialization.
  const missionActiveTemplateData = computed(
    () => missionTemplates.value[missionActiveTemplate.value]!
  );

  function setMissionReq(template: number, stat: StatName, value: number) {
    if (!isTemplateIndex(template) || !isStatValue(value, 0)) {
      return;
    }

    updateTemplate(template, (entry) => ({
      ...entry,
      req: { ...entry.req, [stat]: value }
    }));
  }

  // * Both condition columns are configurable on any template. `null` unsets.
  // * One options object: four positional arguments read as nothing at a call site, and three of these are numbers or short unions.
  function setMissionThreshold({
    template,
    kind,
    stat,
    value
  }: MissionThresholdEdit) {
    if (!isTemplateIndex(template)) {
      return;
    }

    if (value !== null && !isStatValue(value, 1)) {
      return;
    }

    updateTemplate(template, (entry) => ({
      ...entry,
      // * At most one threshold per column; unsetting clears only a value that stat actually holds.
      [kind]:
        value === null
          ? entry[kind][stat] === undefined
            ? entry[kind]
            : {}
          : { [stat]: value }
    }));
  }

  function setMissionActiveTemplate(index: number) {
    if (isTemplateIndex(index)) {
      missionActiveTemplate.value = index;
    }
  }

  function updateTemplate(
    index: number,
    change: (entry: MissionTemplate) => MissionTemplate
  ) {
    missionTemplates.value = missionTemplates.value.map((entry, at) =>
      at === index ? change(entry) : entry
    );
  }

  return {
    missionTemplates,
    missionActiveTemplate,
    missionActiveTemplateData,
    setMissionReq,
    setMissionThreshold,
    setMissionActiveTemplate
  };
}

function isTemplateIndex(value: number): boolean {
  return (
    Number.isInteger(value) && value >= 0 && value < MISSION_TEMPLATE_COUNT
  );
}

function isStatValue(value: number, min: number): boolean {
  return Number.isInteger(value) && value >= min && value <= MAX_STAT_VALUE;
}
