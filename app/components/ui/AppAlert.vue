<script setup lang="ts">
export type AlertKind = 'info' | 'success' | 'error' | 'warning'

const props = withDefaults(defineProps<{
  kind?: AlertKind
  message: string
}>(), {
  kind: 'info',
})

const ICONS: Record<AlertKind, string> = {
  info: 'ℹ',
  success: '✓',
  error: '⚠',
  warning: '⚠',
}
</script>

<template>
  <div :class="[$style.alert, $style[props.kind]]" :role="props.kind === 'error' ? 'alert' : 'status'">
    <span aria-hidden="true">{{ ICONS[props.kind] }}</span>
    <span>{{ message }}</span>
  </div>
</template>

<style module>
.alert {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius);
  border: 1px solid;
  font-size: var(--text-sm);
}
.info { background: var(--color-info-bg); border-color: var(--color-info); color: var(--color-info); }
.success { background: var(--color-success-bg); border-color: var(--color-success); color: var(--color-success); }
.error { background: var(--color-danger-bg); border-color: var(--color-danger); color: var(--color-danger); }
.warning { background: var(--color-warning-bg); border-color: var(--color-warning); color: var(--color-warning); }
</style>
