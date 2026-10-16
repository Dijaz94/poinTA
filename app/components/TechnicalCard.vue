<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    index?: number | string
    code?: string | null
    eyebrow?: string
    accent?: 'none' | 'cobalt' | 'lichen' | 'terracotta'
    interactive?: boolean
    padded?: boolean
  }>(),
  {
    index: undefined,
    code: undefined,
    eyebrow: undefined,
    accent: 'none',
    interactive: false,
    padded: true,
  }
)

const formattedIndex = computed(() => {
  if (props.index === undefined || props.index === null || props.index === '') return null
  if (typeof props.index === 'number') {
    return String(props.index).padStart(2, '0')
  }
  return props.index
})

const hasHeaderBar = computed(() => {
  return Boolean(formattedIndex.value || props.code || props.eyebrow)
})

const accentClasses = computed(() => {
  switch (props.accent) {
    case 'cobalt':
      return 'border-t-2 border-t-[var(--atelier-cobalt)]'
    case 'lichen':
      return 'border-t-2 border-t-[var(--atelier-lichen-solid)]'
    case 'terracotta':
      return 'atelier-card-terracotta border-t-2 border-t-[var(--atelier-terracotta-solid)]'
    default:
      return ''
  }
})
</script>

<template>
  <article
    class="atelier-card flex flex-col overflow-hidden"
    :class="[
      interactive ? 'atelier-card-interactive atelier-card-cobalt' : '',
      accentClasses,
    ]"
  >
    <!-- Cabecera de Ficha Técnica -->
    <header
      v-if="hasHeaderBar || $slots.meta"
      class="flex items-center justify-between gap-2 px-4 py-2 border-b border-[var(--atelier-border-muted)] bg-[var(--atelier-surface-muted)]/45 text-xs font-tech"
    >
      <div class="flex items-center gap-2 min-w-0">
        <span
          v-if="formattedIndex"
          class="inline-flex items-center justify-center px-1.5 py-0.5 rounded-[4px] bg-[var(--atelier-surface)] border border-[var(--atelier-border)] text-[11px] font-semibold text-highlighted shrink-0"
        >
          {{ formattedIndex }}
        </span>
        <span v-if="eyebrow" class="atelier-tag text-muted truncate">
          {{ eyebrow }}
        </span>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <slot name="meta">
          <span v-if="code" class="font-tech text-xs font-medium text-toned">
            {{ code }}
          </span>
        </slot>
      </div>
    </header>

    <!-- Cuerpo Principal -->
    <div class="flex-1 flex flex-col" :class="padded ? 'p-4 sm:p-5' : ''">
      <slot />
    </div>

    <!-- Pie de Ficha Opcional -->
    <footer
      v-if="$slots.footer"
      class="px-4 py-2.5 border-t border-[var(--atelier-border-muted)] bg-[var(--atelier-surface-muted)]/30"
    >
      <slot name="footer" />
    </footer>
  </article>
</template>
