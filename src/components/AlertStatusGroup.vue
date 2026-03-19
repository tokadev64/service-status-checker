<script setup lang="ts">
import type { ServiceStatus } from '../shared/types.ts';
/* biome-ignore lint/correctness/noUnusedImports: Vue template resolves component usage */
import BaseStatusGroup from './BaseStatusGroup.vue';
/* biome-ignore lint/correctness/noUnusedImports: Vue template resolves component usage */
import CategoryStatusGroup from './CategoryStatusGroup.vue';

defineProps<{
  groups: Array<{
    iconName: string;
    label: string;
    services: ServiceStatus[];
  }>;
}>();
</script>

<template>
  <BaseStatusGroup
    label="Alert"
    tone="red"
    icon-name="error"
  >
    <section class="status-group-grid">
      <CategoryStatusGroup
        v-for="group in groups"
        :key="group.label"
        :icon-name="group.iconName"
        :label="group.label"
        :services="group.services"
      />
    </section>
  </BaseStatusGroup>
</template>
