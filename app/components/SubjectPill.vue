<script setup lang="ts">
import type { Subject } from '~/types/subjects'

defineProps<{
  subject: Subject
}>()

const emit = defineEmits<{
  unpin: [subjectId: string]
}>()
</script>

<template>
  <div
    class="group inline-flex items-stretch rounded-[8px] border border-(--atelier-border) bg-(--atelier-surface) shadow-(--atelier-shadow-rest) hover:border-(--atelier-cobalt) transition-colors duration-150 overflow-hidden"
  >
    <NuxtLink
      :to="`/${subject.id}`"
      class="inline-flex items-center gap-2.5 pl-3.5 pr-2.5 min-h-11 text-sm font-medium text-highlighted hover:text-(--atelier-cobalt) transition-colors"
    >
      <span
        v-if="subject.code"
        class="font-tech text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded-[4px] bg-(--atelier-cobalt-soft) text-(--atelier-cobalt) border border-(--atelier-cobalt-border)/60"
      >
        {{ subject.code }}
      </span>
      <span class="truncate max-w-45 sm:max-w-60">
        {{ subject.name }}
      </span>
      <UIcon
        name="i-lucide-arrow-up-right"
        class="size-3.5 text-muted group-hover:text-(--atelier-cobalt) shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </NuxtLink>

    <button
      type="button"
      class="inline-flex items-center justify-center min-w-11 min-h-11 border-l border-(--atelier-border-muted) text-muted hover:text-(--atelier-terracotta) hover:bg-(--atelier-surface-muted)/60 transition-colors"
      :aria-label="`Desfijar ${subject.name}`"
      :title="`Desfijar ${subject.name}`"
      @click.prevent="emit('unpin', subject.id)"
    >
      <UIcon name="i-lucide-pin-off" class="size-3.5" />
    </button>
  </div>
</template>
