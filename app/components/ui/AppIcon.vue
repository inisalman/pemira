<script setup lang="ts">
// Stroke icon set aligned with the landing portal (stroke-width 2, round caps).
// Usage: <AppIcon name="calendar" /> — decorative by default (aria-hidden).
// Pass `label` to expose it to assistive tech as an image.
export type IconName =
  | 'shield-check'
  | 'calendar'
  | 'users'
  | 'user'
  | 'chart'
  | 'vote'
  | 'arrow-right'
  | 'check'
  | 'check-circle'
  | 'clock'
  | 'list'
  | 'settings'
  | 'file-text'
  | 'id-card'
  | 'lock'
  | 'inbox'
  | 'alert-triangle'
  | 'refresh'

const props = withDefaults(defineProps<{
  name: IconName
  size?: number | string
  label?: string
}>(), {
  size: 20,
  label: '',
})

// Each entry is the inner markup of a 24x24 viewBox icon.
const PATHS: Record<IconName, string> = {
  'shield-check': '<path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5z" /><path d="m9 12 2 2 4-4" />',
  'calendar': '<rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" />',
  'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />',
  'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />',
  'chart': '<path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" rx="1" /><rect x="13" y="7" width="3" height="10" rx="1" />',
  'vote': '<path d="m9 12 2 2 4-4" /><rect x="3" y="4" width="18" height="16" rx="2" />',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6" />',
  'check': '<path d="m5 12 5 5 9-11" />',
  'check-circle': '<circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" />',
  'clock': '<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />',
  'list': '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />',
  'settings': '<circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h6" />',
  'id-card': '<rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16a3 3 0 0 1 6 0M15 10h3M15 14h3" />',
  'lock': '<rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />',
  'inbox': '<path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" />',
  'alert-triangle': '<path d="M10.3 3.3 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" />',
  'refresh': '<path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" />',
}
</script>

<template>
  <svg
    :class="$style.icon"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label || undefined"
    v-html="PATHS[name]"
  />
</template>

<style module>
.icon { display: inline-block; flex-shrink: 0; vertical-align: middle; }
</style>
