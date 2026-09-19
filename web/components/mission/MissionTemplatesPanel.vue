<template>
  <section class="bg-default panel">
    <div class="flex plate items-center px-3">
      <h2 class="font-heading text-title uppercase">Mission templates</h2>
    </div>

    <div class="flex flex-col gap-2 p-3">
      <MissionTemplateCard
        v-for="(template, index) in missionTemplates"
        :key="index"
        v-model:column-view="columnView"
        :template="template"
        :index="index"
        :active="index === activeIndex"
        @select="() => setMissionActiveTemplate(index)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import MissionTemplateCard from '@/components/mission/MissionTemplateCard.vue';

const {
  missionTemplates,
  missionActiveTemplate: activeIndex,
  setMissionActiveTemplate
} = useHeroPlanner();

// * A plain ref, not planner state: the build document must never carry a layout choice. It lives here rather than in a card, since every card's toggle moves the same columns.
const columnView = ref<'req' | 'conditions'>('req');
</script>
