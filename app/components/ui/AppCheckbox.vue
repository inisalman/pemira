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
  cursor: pointer;
}
.wrap input {
  margin-top: 0.2rem;
  accent-color: var(--color-primary);
  width: 1rem;
  height: 1rem;
}
.wrap input:disabled + span { opacity: 0.55; }
</style>
