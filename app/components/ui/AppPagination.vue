<script setup lang="ts">
const props = withDefaults(defineProps<{
  page: number
  pageSize: number
  total: number
}>(), {})

const emit = defineEmits<{ 'update:page': [page: number] }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
</script>

<template>
  <nav v-if="totalPages > 1" :class="$style.nav" aria-label="Navigasi halaman">
    <AppButton variant="ghost" :disabled="page <= 1" @click="emit('update:page', page - 1)">
      ← Sebelumnya
    </AppButton>
    <span :class="$style.status">Halaman {{ page }} dari {{ totalPages }}</span>
    <AppButton variant="ghost" :disabled="page >= totalPages" @click="emit('update:page', page + 1)">
      Selanjutnya →
    </AppButton>
  </nav>
</template>

<style module>
.nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
}
.status { color: var(--color-text-muted); font-size: var(--text-sm); }
</style>
