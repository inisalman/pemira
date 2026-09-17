<script setup lang="ts">
defineProps<{
  label: string
  modelValue?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <label :class="$style.wrap">
    <input
      type="checkbox"
      :checked="modelValue ?? false"
      :disabled="disabled"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    >
    <span>{{ label }}</span>
  </label>
</template>

<style module>
.wrap {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  min-height: 2.75rem;
  padding-block: .65rem;
  cursor: pointer;
}
.wrap input {
  margin: 0.1rem 0 0;
  accent-color: var(--color-primary);
  width: 1.25rem;
  height: 1.25rem;
}
.wrap input:disabled + span { opacity: 0.55; }
</style>
