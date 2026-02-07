<template>
  <div>
    <table>
      <thead>
        <tr>
          <th>Stat</th>
          <th
            v-for="hero in heroes"
            :key="hero.id"
          >
            {{ hero.name }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="stat in STAT_NAMES"
          :key="stat"
        >
          <td class="capitalize">{{ stat }}</td>
          <td
            v-for="hero in heroes"
            :key="hero.id"
          >
            {{ hero.startingStats[stat] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { STAT_NAMES } from '~/types/hero';

const { data: heroes } = await useFetch('/api/heroes');
</script>
