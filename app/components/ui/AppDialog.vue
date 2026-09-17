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

const dialog = ref<HTMLDialogElement | null>(null)
const titleId = useId()
watch(() => props.open, async (open) => {
  await nextTick()
  if (open && !dialog.value?.open) dialog.value?.showModal()
  if (!open && dialog.value?.open) dialog.value.close()
}, { immediate: true })

function onCancel() {
  if (!props.loading) emit('cancel')
}
</script>

<template>
    <dialog
      ref="dialog"
      :class="$style.dialog"
      :aria-labelledby="titleId"
      @cancel.prevent="onCancel"
    >
      <h2 :id="titleId" :class="$style.title">{{ title }}</h2>
      <div :class="$style.body"><slot /></div>
      <div :class="$style.actions">
        <AppButton variant="secondary" :disabled="loading" autofocus @click="onCancel">{{ cancelLabel }}</AppButton>
        <AppButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">
          {{ confirmLabel }}
        </AppButton>
      </div>
    </dialog>
</template>

<style module>
.dialog::backdrop { background: rgb(36 49 45 / 0.45); }
.dialog {
  border: 0;
  color: var(--color-text);
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  max-width: 28rem;
  width: calc(100% - 2rem);
  padding: clamp(1.25rem, 4vw, 2rem);
  box-shadow: var(--shadow-md);
}
.title { font-size: var(--text-xl); margin-bottom: var(--space-2); }
.body { color: var(--color-text); margin-bottom: var(--space-6); }
.actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--space-2); }
@media (max-width: 30rem) { .actions > * { flex: 1 1 100%; } }
</style>
