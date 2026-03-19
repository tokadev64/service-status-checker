<script setup lang="ts">
import type { ServiceStatus } from '../shared/types.ts';
/* biome-ignore lint/correctness/noUnusedImports: Vue template resolves component usage */
import StatusCard from './StatusCard.vue';

defineProps<{
  iconName: string;
  label: string;
  services: ServiceStatus[];
}>();
</script>

<template>
  <section class="status-group-card category-group-card" data-group-tone="gray">
    <div class="status-group-header">
      <span class="status-group-icon material-symbols-outlined">
        {{ iconName }}
      </span>
      <h3 class="status-group-title">{{ label }}</h3>
    </div>

    <section class="status-group-grid">
      <StatusCard
        v-for="service in services"
        :key="service.key"
        :service="service"
      />
    </section>
  </section>
</template>
