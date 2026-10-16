<script setup lang="ts">
import type { Announcement } from '~/types/announcements'
import { isPollExpired } from '~/utils/poll'

defineProps<{
  announcement: Announcement
  deleting?: boolean
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()
</script>

<template>
  <TechnicalCard
    :eyebrow="announcement.type === 'POLL' ? 'VOTACIÓN PUBLICADA' : 'COMUNICADO PUBLICADO'"
    :accent="announcement.type === 'POLL' ? 'terracotta' : 'cobalt'"
  >
    <template #meta>
      <div class="flex items-center gap-2">
        <span
          v-if="announcement.type === 'POLL' && announcement.deadline"
          class="font-tech text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px] border"
          :class="isPollExpired(announcement.deadline)
            ? 'bg-[var(--atelier-surface)] border-[var(--atelier-border)] text-muted'
            : 'bg-[var(--atelier-terracotta-soft)] border-[var(--atelier-terracotta-border)] text-[var(--atelier-terracotta)]'"
        >
          {{ isPollExpired(announcement.deadline) ? 'CERRADA' : `CIERRA: ${formatDateTime(announcement.deadline)}` }}
        </span>
        <span class="font-tech text-xs text-muted">
          {{ formatDateTime(announcement.createdAt) }}
        </span>
      </div>
    </template>

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <h3 class="font-editorial text-xl font-medium text-highlighted">{{ announcement.title }}</h3>
          <p v-if="announcement.content" class="text-default text-sm whitespace-pre-wrap leading-relaxed mt-1">
            {{ announcement.content }}
          </p>
        </div>

        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-trash"
          size="sm"
          class="min-h-[38px]"
          :loading="deleting"
          aria-label="Eliminar publicación"
          @click="emit('delete', announcement.id)"
        />
      </div>

      <div
        v-if="announcement.type === 'POLL' && announcement.options?.length"
        class="space-y-3 pt-3 border-t border-[var(--atelier-border-muted)]"
      >
        <div class="flex items-center justify-between text-xs font-tech text-muted">
          <span>CÓMPUTO DE VOTOS EN TIEMPO REAL</span>
          <span class="text-highlighted font-semibold">
            {{ announcement.totalVotes ?? 0 }} {{ (announcement.totalVotes ?? 0) === 1 ? 'VOTO TOTAL' : 'VOTOS TOTALES' }}
          </span>
        </div>

        <PollResults :options="announcement.options" :total-votes="announcement.totalVotes" size="sm" />
      </div>
    </div>
  </TechnicalCard>
</template>
