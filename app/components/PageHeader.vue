<script setup lang="ts">
import type { IconName } from './ui/AppIcon.vue'

// Reusable page hero aligned with the landing portal: soft green radial
// gradient, kicker eyebrow, large tight headline, lead paragraph, an icon
// badge, and an actions slot on the right.
withDefaults(defineProps<{
  kicker?: string
  title: string
  lead?: string
  icon?: IconName | ''
}>(), {
  kicker: '',
  lead: '',
  icon: '',
})
</script>

<template>
  <header :class="$style.hero">
    <div :class="$style.copy">
      <span v-if="icon" :class="$style.badge" aria-hidden="true">
        <AppIcon :name="icon" :size="22" />
      </span>
      <div :class="$style.text">
        <p v-if="kicker" :class="$style.kicker">{{ kicker }}</p>
        <h1 :class="$style.title">{{ title }}</h1>
        <p v-if="lead" :class="$style.lead">{{ lead }}</p>
        <slot name="meta" />
      </div>
    </div>
    <div v-if="$slots.actions" :class="$style.actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style module>
.hero {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
  flex-wrap: wrap;
  overflow: hidden;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(32rem 22rem at 92% -30%, var(--color-primary-tint) 0%, transparent 62%),
    linear-gradient(var(--color-surface), var(--color-surface));
  box-shadow: var(--shadow-sm);
}
.copy { display: flex; align-items: flex-start; gap: var(--space-4); min-width: 0; }
.badge {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  border-radius: 0.85rem;
  color: var(--color-primary-contrast);
  background: linear-gradient(135deg, var(--color-primary-strong), var(--color-primary));
  box-shadow: var(--shadow-sm);
}
.text { min-width: 0; }
.kicker {
  margin: 0 0 var(--space-2);
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.title {
  margin: 0;
  font-size: clamp(1.85rem, 3.4vw, 2.6rem);
  line-height: 1.05;
  letter-spacing: var(--tracking-heading);
}
.lead { margin: var(--space-3) 0 0; max-width: 44rem; color: var(--color-text-muted); }
.actions { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.actions :global(.period-select) { min-width: 0; }
@media (max-width: 48rem) {
  .hero { flex-direction: column; }
  .actions { width: 100%; }
  .actions > * { flex: 1 1 auto; }
  .actions :global(.period-select),
  .actions :global(.period-select) select,
  .actions :global(button),
  .actions :global(.action-link) { width: 100%; }
}
</style>
