<script setup lang="ts">
import { computed } from 'vue';
import { brandAssets } from '../brand-assets';
import type { ServiceStatus } from '../shared/types';
import { toneIcons } from './status-icons';

const props = defineProps<{
  service: ServiceStatus;
}>();

/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads these bindings */
const brandAsset = computed(() => brandAssets[props.service.key]);
/* biome-ignore lint/correctness/noUnusedVariables: Vue template reads these bindings */
const iconName = computed(() => toneIcons[props.service.presentation.tone]);
</script>

<template>
  <details
    class="status-card"
    :data-tone="service.presentation.tone"
  >
    <summary class="status-card-summary">
      <div class="brand-mark">
        <img
          v-if="brandAsset"
          :src="brandAsset.src"
          :alt="brandAsset.alt"
          loading="lazy"
        />
        <span v-else class="brand-fallback">{{ service.name }}</span>
      </div>
      <span class="status-service-name">{{ service.name }}</span>
      <span class="status-icon material-symbols-outlined" :data-tone="service.presentation.tone">
        {{ iconName }}
      </span>
      <span class="status-expand material-symbols-outlined">expand_more</span>
    </summary>

    <div class="status-card-body">
      <dl class="status-meta">
        <div class="status-meta-row">
          <dt>現在の状態</dt>
          <dd>{{ service.presentation.label }}</dd>
        </div>
        <div class="status-meta-row">
          <dt>最終更新</dt>
          <dd>{{ service.checkedAtLabel }}</dd>
        </div>
        <div v-if="service.sinceLabel" class="status-meta-row">
          <dt>発生時刻</dt>
          <dd>{{ service.sinceLabel }}</dd>
        </div>
        <div
          v-if="
            service.category === 'core-infra' &&
            service.regions &&
            service.regions.length > 0
          "
          class="status-meta-row"
        >
          <dt>Regions</dt>
          <dd class="status-region-list">
            <span
              v-for="region in service.regions"
              :key="region"
              class="status-region-chip"
            >
              {{ region }}
            </span>
          </dd>
        </div>
      </dl>

      <a
        class="status-link"
        :href="service.statusUrl"
        target="_blank"
        rel="noreferrer"
        :aria-label="`${service.name} status page を開く`"
      >
        公式 status page
      </a>
    </div>
    <span class="sr-only">{{ service.presentation.label }}</span>
  </details>
</template>
