<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  modelValue?: string
  type?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  autocomplete?: string
  inputmode?: 'text' | 'search' | 'none' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal'
}>(), {
  modelValue: '',
  type: 'text',
  required: false,
  disabled: false,
  error: '',
  hint: '',
  autocomplete: undefined,
  inputmode: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const id = useId()
const errorId = `${id}-error`
const hintId = `${id}-hint`
</script>

<template>
  <div :class="$style.field">
    <label :for="id" :class="$style.label">
      {{ label }}
      <span v-if="required" aria-hidden="true"> *</span>
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :required="required"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :class="$style.input"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? errorId : hint ? hintId : undefined"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <p v-if="error" :id="errorId" :class="$style.error" role="alert">
      <span aria-hidden="true">⚠</span> {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" :class="$style.hint">{{ hint }}</p>
  </div>
</template>

<style module>
.field { display: flex; flex-direction: column; gap: var(--space-1); }
.label { font-weight: 600; font-size: var(--text-sm); }
.input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  min-height: 2.75rem;
}
.input:focus-visible { box-shadow: var(--focus-ring); outline: none; }
.input:hover:not(:disabled) { border-color: var(--color-primary); }
.input:disabled { opacity: 0.55; background: var(--color-primary-soft); }
.error { color: var(--color-danger); font-size: var(--text-sm); margin: 0; }
.hint { color: var(--color-text-muted); font-size: var(--text-sm); margin: 0; }
</style>
