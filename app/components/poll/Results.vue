<script setup lang="ts">
import type { PollOptionData } from '~/types/announcements'
import { pluralVotes } from '~/utils/poll';
import { votePercentage } from '~/utils/poll';
defineProps<{
  options: PollOptionData[]
  totalVotes?: number | null
  votedOptionId?: string | null
  /** Padding del item: 'md' (público) o 'sm' (admin) */
  size?: 'sm' | 'md'
}>()
</script>

<template>
  <div class="space-y-2.5">
    <div
      v-for="opt in options"
      :key="opt.id"
      class="space-y-1 rounded-lg border transition-all"
      :class="[
        size === 'sm' ? 'p-2.5' : 'p-3',
        votedOptionId === opt.id
          ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/30'
          : 'bg-muted/20 border-muted/40',
      ]"
    >
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span class="font-medium text-default">{{ opt.label }}</span>
          <UBadge v-if="votedOptionId === opt.id" color="primary" variant="solid" size="xs">
            Tu voto
          </UBadge>
        </div>
        <span class="text-xs font-bold text-muted">
          {{ opt.voteCount }} {{ pluralVotes(opt.voteCount) }}
          ({{ votePercentage(opt.voteCount, totalVotes) }}%)
        </span>
      </div>
      <div class="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
        <div
          class="h-2 rounded-full transition-all duration-500"
          :class="votedOptionId && votedOptionId !== opt.id ? 'bg-primary/70' : 'bg-primary'"
          :style="{ width: `${votePercentage(opt.voteCount, totalVotes)}%` }"
        />
      </div>
    </div>
  </div>
</template>
