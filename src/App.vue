<script setup lang="ts">
/* biome-ignore lint/correctness/noUnusedImports: Vue template resolves component usage */
import DashboardHeader from './components/DashboardHeader.vue';
/* biome-ignore lint/correctness/noUnusedImports: Vue template resolves component usage */
import StatusBoard from './components/StatusBoard.vue';
import { provideDashboardContext } from './composables/useDashboardContext.ts';
import { DASHBOARD_THEME } from './dashboard-theme.ts';

/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads these bindings */
const { errorMessage } = provideDashboardContext();
/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads this binding */
const dashboardTheme = DASHBOARD_THEME;
</script>

<template>
  <main class="page-shell" :data-theme="dashboardTheme">
    <DashboardHeader />

    <p v-if="errorMessage" class="meta-error">{{ errorMessage }}</p>

    <StatusBoard />
  </main>
</template>
