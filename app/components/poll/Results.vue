<script setup lang="ts">
import type { PollOptionData } from '~/types/announcements'
import { pluralVotes, votePercentage } from '~/utils/poll'

defineProps<{
  options: PollOptionData[]
  totalVotes?: number | null
  votedOptionId?: string | null
  /** Padding del item: 'md' (público) o 'sm' (admin) */
  size?: 'sm' | 'md'
}>()
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="(opt, idx) in options"
      :key="opt.id"
      class="rounded-[6px] border transition-colors"
      :class="[
        size === 'sm' ? 'p-2.5' : 'p-3',
        votedOptionId === opt.id
          ? 'bg-[var(--atelier-cobalt-soft)]/60 border-[var(--atelier-cobalt)]'
          : 'bg-[var(--atelier-surface-muted)]/35 border-[var(--atelier-border)]',
      ]"
    >
      <div class="flex items-center justify-between gap-2 text-sm mb-1.5">
        <div class="flex items-center gap-2 min-w-0">
          <span class="font-tech text-xs text-muted shrink-0">
            {{ String.fromCharCode(65 + idx) }}.
          </span>
          <span class="font-medium text-highlighted truncate">{{ opt.label }}</span>
          <span
            v-if="votedOptionId === opt.id"
            class="font-tech text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-[4px] bg-[var(--atelier-cobalt)] text-white shrink-0"
          >
            TU VOTO
          </span>
        </div>

        <span class="font-tech text-xs font-semibold text-toned shrink-0">
          {{ opt.voteCount }} {{ pluralVotes(opt.voteCount) }} · {{ votePercentage(opt.voteCount, totalVotes) }}%
        </span>
      </div>

      <!-- Barra de progreso técnica con bordes definidos -->
      <div class="w-full bg-[var(--atelier-border-muted)] rounded-[3px] h-2 overflow-hidden">
        <div
          class="h-2 rounded-[3px] transition-all duration-200"
          :class="votedOptionId === opt.id ? 'bg-[var(--atelier-cobalt)]' : 'bg-[var(--atelier-cobalt)]/75'"
          :style="{ width: `${votePercentage(opt.voteCount, totalVotes)}%` }"
        />
      </div>
    </div>
  </div>
</template>
