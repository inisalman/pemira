<script setup lang="ts">
export interface RadioOption {
  value: string
  label: string
  description?: string
}

const props = defineProps<{
  legend: string
  name: string
  options: RadioOption[]
  modelValue?: string
  error?: string
  required?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <fieldset :class="$style.group" :aria-invalid="error ? 'true' : undefined">
    <legend :class="$style.legend">
      {{ legend }}
      <span v-if="required" aria-hidden="true"> *</span>
    </legend>
    <label
      v-for="opt in options"
      :key="opt.value"
      :class="$style.option"
      :aria-checked="modelValue === opt.value"
      role="radio"
    >
      <input
        type="radio"
        :name="name"
        :value="opt.value"
        :checked="modelValue === opt.value"
        @change="emit('update:modelValue', opt.value)"
      >
      <span :class="$style.text">
        <span :class="$style.label">{{ opt.label }}</span>
        <span v-if="opt.description" :class="$style.desc">{{ opt.description }}</span>
      </span>
    </label>
    <p v-if="error" :class="$style.error" role="alert">
      <span aria-hidden="true">⚠</span> {{ error }}
    </p>
  </fieldset>
</template>

<style module>
.group {
  border: none;
  padding: 0;
  margin: 0 0 var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.legend { font-weight: 600; font-size: var(--text-sm); padding: 0; margin-bottom: var(--space-1); }
.option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  background: var(--color-surface);
}
.option:hover { border-color: var(--color-primary); }
.option:has(input:checked) { border-color: var(--color-primary); background: var(--color-primary-soft); }
.option input { margin-top: 0.2rem; accent-color: var(--color-primary); }
.text { display: flex; flex-direction: column; }
.label { font-weight: 600; }
.desc { color: var(--color-text-muted); font-size: var(--text-sm); }
.error { color: var(--color-danger); font-size: var(--text-sm); margin: 0; }
</style>
