<script setup lang="ts">
import type { IconName } from './AppIcon.vue'

// Friendly empty / zero-data state: centered icon badge, title, description,
// and an optional actions slot. Use for "no data yet" placeholders instead of
// a bare dashed box.
withDefaults(defineProps<{
  icon?: IconName
  title: string
  description?: string
  loading?: boolean
}>(), {
  icon: 'inbox',
  description: '',
  loading: false,
})
</script>

<template>
  <div :class="$style.empty" :role="loading ? 'status' : undefined">
    <span :class="$style.icon" aria-hidden="true">
      <AppIcon :name="icon" :size="26" />
    </span>
    <p :class="$style.title">{{ title }}</p>
    <p v-if="description" :class="$style.desc">{{ description }}</p>
    <div v-if="$slots.default" :class="$style.actions">
      <slot />
    </div>
  </div>
</template>

<style module>
.empty {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  padding: clamp(2rem, 5vw, 3.5rem);
  text-align: center;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
}
.icon {
  display: grid; place-items: center; width: 3.5rem; height: 3.5rem; margin-bottom: var(--space-2);
  border-radius: 50%; color: var(--color-primary); background: var(--color-primary-tint);
}
.title { margin: 0; font-size: var(--text-lg); font-weight: 700; color: var(--color-text); }
.desc { margin: 0; max-width: 34rem; color: var(--color-text-muted); font-size: var(--text-sm); }
.actions { margin-top: var(--space-3); display: flex; flex-wrap: wrap; gap: var(--space-3); justify-content: center; }
</style>
