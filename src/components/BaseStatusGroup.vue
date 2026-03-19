<script setup lang="ts">
defineProps<{
  label: string;
  tone: 'red' | 'yellow' | 'gray' | 'green';
  iconName: string;
}>();
</script>

<template>
  <section class="status-group-card card" :data-group-tone="tone">
    <div class="status-group-header">
      <span class="status-group-icon material-symbols-outlined">
        {{ iconName }}
      </span>
      <h3 class="status-group-title">{{ label }}</h3>
    </div>

    <slot />
  </section>
</template>
