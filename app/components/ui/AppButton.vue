<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent'
  type?: 'button' | 'submit'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
  loading: false,
  block: false,
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[$style.button, $style[variant], { [$style.block]: block }]"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" :class="$style.spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style module>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 0.7rem 1.25rem;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  min-height: 2.875rem;
  max-width: 100%;
  line-height: 1.3;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.block { width: 100%; }

.primary { background: var(--color-primary); color: var(--color-primary-contrast); }
.primary:hover:not(:disabled) { background: var(--color-primary-strong); }

.secondary { background: var(--color-primary-soft); color: var(--color-primary-strong); border-color: var(--color-border-strong); }
.secondary:hover:not(:disabled) { background: var(--color-primary-tint); border-color: var(--color-primary); }

.danger { background: var(--color-danger); color: #fff; }
.danger:hover:not(:disabled) { background: #93291f; }

.ghost { background: transparent; color: var(--color-primary-strong); border-color: var(--color-border); }
.ghost:hover:not(:disabled) { background: var(--color-primary-soft); border-color: var(--color-primary); }

.accent { background: var(--color-accent); color: #fff; }
.accent:hover:not(:disabled) { background: var(--color-accent-strong); }

.button:active:not(:disabled) { transform: translateY(1px); }

.spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
