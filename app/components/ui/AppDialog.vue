<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
}>(), {
  confirmLabel: 'Konfirmasi',
  cancelLabel: 'Batal',
  danger: false,
  loading: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function onCancel() {
  if (!props.loading) emit('cancel')
}
</script>

<template>
  <div v-if="open" :class="$style.overlay" @click.self="onCancel" @keydown.esc="onCancel">
    <div
      :class="$style.dialog"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="`${title}-title`"
      tabindex="-1"
    >
      <h2 :id="`${title}-title`" :class="$style.title">{{ title }}</h2>
      <div :class="$style.body"><slot /></div>
      <div :class="$style.actions">
        <AppButton variant="ghost" :disabled="loading" @click="onCancel">{{ cancelLabel }}</AppButton>
        <AppButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">
          {{ confirmLabel }}
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style module>
.overlay {
  position: fixed;
  inset: 0;
  background: rgb(36 49 45 / 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  z-index: 50;
}
.dialog {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  max-width: 28rem;
  width: 100%;
  padding: var(--space-6);
  box-shadow: 0 8px 30px rgb(36 49 45 / 0.18);
}
.title { font-size: var(--text-xl); margin-bottom: var(--space-2); }
.body { color: var(--color-text); margin-bottom: var(--space-6); }
.actions { display: flex; justify-content: flex-end; gap: var(--space-2); }
</style>
