<script setup lang="ts">
defineProps<{
  columns: { key: string; label: string; align?: 'start' | 'end' }[]
  rows: Record<string, unknown>[]
  caption?: string
  emptyMessage?: string
  loading?: boolean
}>()

const emit = defineEmits<{ rowClick: [row: Record<string, unknown>] }>()
</script>

<template>
  <div v-if="loading" :class="$style.state" role="status">Memuat data…</div>
  <div v-else-if="rows.length === 0" :class="$style.state" role="status">
    {{ emptyMessage ?? 'Belum ada data.' }}
  </div>
  <div v-else :class="$style.scroll" tabindex="0" role="region" aria-label="Tabel data">
    <table :class="$style.table">
      <caption v-if="caption" :class="$style.caption">{{ caption }}</caption>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" scope="col" :class="{ [$style.end]: col.align === 'end' }">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i" @click="emit('rowClick', row)">
          <td v-for="col in columns" :key="col.key" :class="{ [$style.end]: col.align === 'end' }">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">{{ row[col.key] }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style module>
.state {
  padding: var(--space-8) var(--space-4);
  text-align: center;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-style: dashed;
  border-color: var(--color-border-strong);
  border-radius: var(--radius-lg);
}
.scroll { overflow-x: auto; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); box-shadow: var(--shadow-sm); }
.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-surface);
  border: 0;
  font-size: var(--text-sm);
}
.caption { text-align: start; color: var(--color-text-muted); padding: var(--space-2) var(--space-3); }
th {
  text-align: start;
  padding: var(--space-3);
  border-bottom: 2px solid var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: .75rem;
  letter-spacing: .02em;
}
td { padding: .9rem var(--space-3); border-bottom: 1px solid var(--color-border); }
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover { background: var(--color-primary-soft); }
.end { text-align: end; }
</style>
