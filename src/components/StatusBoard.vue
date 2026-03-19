<script setup lang="ts">
import { computed } from 'vue';
import { useDashboardContext } from '../composables/useDashboardContext.ts';
import type { ServiceCategory, ServiceStatus } from '../shared/types.ts';
/* biome-ignore lint/correctness/noUnusedImports: Vue template resolves component usage */
import AlertStatusGroup from './AlertStatusGroup.vue';
/* biome-ignore lint/correctness/noUnusedImports: Vue template resolves component usage */
import SuccessStatusGroup from './SuccessStatusGroup.vue';
/* biome-ignore lint/correctness/noUnusedImports: Vue template resolves component usage */
import UnknownStatusGroup from './UnknownStatusGroup.vue';
/* biome-ignore lint/correctness/noUnusedImports: Vue template resolves component usage */
import WarningStatusGroup from './WarningStatusGroup.vue';

const { services } = useDashboardContext();

const alertServices = computed(() =>
  services.value.filter((service) => service.presentation.tone === 'red'),
);

const warningServices = computed(() =>
  services.value.filter((service) => service.presentation.tone === 'yellow'),
);

const unknownServices = computed(() =>
  services.value.filter((service) => service.presentation.tone === 'gray'),
);

const successServices = computed(() =>
  services.value.filter((service) => service.presentation.tone === 'green'),
);

const categoryGroups: Array<{
  category: ServiceCategory;
  iconName: string;
  label: string;
}> = [
  {
    category: 'core-infra',
    iconName: 'dns',
    label: 'Core Infra',
  },
  {
    category: 'developer-platform',
    iconName: 'terminal',
    label: 'Developer Platform',
  },
  {
    category: 'ai',
    iconName: 'neurology',
    label: 'AI',
  },
  {
    category: 'work-collaboration',
    iconName: 'groups',
    label: 'Work & Collaboration',
  },
  {
    category: 'business-apps',
    iconName: 'business_center',
    label: 'Business Apps',
  },
];

function groupByCategory(inputServices: ServiceStatus[]) {
  return categoryGroups
    .map((group) => ({
      iconName: group.iconName,
      label: group.label,
      services: inputServices.filter(
        (service) => service.category === group.category,
      ),
    }))
    .filter((group) => group.services.length > 0);
}

/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads these bindings */
const alertCategoryGroups = computed<
  Array<{ iconName: string; label: string; services: ServiceStatus[] }>
>(() => groupByCategory(alertServices.value));

/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads these bindings */
const warningCategoryGroups = computed<
  Array<{ iconName: string; label: string; services: ServiceStatus[] }>
>(() => groupByCategory(warningServices.value));

/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads these bindings */
const unknownCategoryGroups = computed<
  Array<{ iconName: string; label: string; services: ServiceStatus[] }>
>(() => groupByCategory(unknownServices.value));

/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads these bindings */
const successCategoryGroups = computed<
  Array<{ iconName: string; label: string; services: ServiceStatus[] }>
>(() => groupByCategory(successServices.value));
</script>

<template>
  <section class="board-shell">
    <div class="board-toolbar">
      <span class="board-title">Official Service Status</span>
    </div>

    <div class="status-groups">
      <AlertStatusGroup
        v-if="alertCategoryGroups.length > 0"
        :groups="alertCategoryGroups"
      />
      <WarningStatusGroup
        v-if="warningCategoryGroups.length > 0"
        :groups="warningCategoryGroups"
      />
      <UnknownStatusGroup
        v-if="unknownCategoryGroups.length > 0"
        :groups="unknownCategoryGroups"
      />
      <SuccessStatusGroup
        v-if="successCategoryGroups.length > 0"
        :groups="successCategoryGroups"
      />
    </div>
  </section>
</template>
