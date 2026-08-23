<script setup lang="ts">
import type { Announcement } from '~/types/announcements'

defineProps<{
  announcement: Announcement
  deleting?: boolean
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()

const isExpired = (deadlineVal: string | null) => {
  if (!deadlineVal) return false
  return new Date() > new Date(deadlineVal)
}
</script>

<template>
  <UCard
    :ui="{
      root: announcement.type === 'POLL' ? 'border-l-4 border-l-indigo-500' : 'border-l-4 border-l-primary',
    }"
  >
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 mb-1.5">
            <UBadge
              :color="announcement.type === 'POLL' ? 'primary' : 'neutral'"
              variant="subtle"
              size="xs"
            >
              <UIcon :name="announcement.type === 'POLL' ? 'i-lucide-chart-bar' : 'i-lucide-megaphone'" class="size-3 mr-1" />
              {{ announcement.type === 'POLL' ? 'Votación' : 'Comunicado' }}
            </UBadge>

            <UBadge
              v-if="announcement.type === 'POLL' && announcement.deadline"
              :color="isExpired(announcement.deadline) ? 'error' : 'warning'"
              variant="soft"
              size="xs"
            >
              <UIcon name="i-lucide-clock" class="size-3 mr-1" />
              {{ isExpired(announcement.deadline) ? 'Votación Cerrada' : `Cierra: ${formatDateTime(announcement.deadline)}` }}
            </UBadge>

            <span class="text-xs text-muted whitespace-nowrap">
              {{ formatDateTime(announcement.createdAt) }}
            </span>
          </div>

          <h3 class="font-bold text-lg text-default">{{ announcement.title }}</h3>
          <p v-if="announcement.content" class="text-default text-sm whitespace-pre-wrap leading-relaxed mt-1">
            {{ announcement.content }}
          </p>
        </div>

        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-trash"
          size="sm"
          :loading="deleting"
          aria-label="Eliminar publicación"
          @click="emit('delete', announcement.id)"
        />
      </div>

      <!-- Resultados en tiempo real de la votación (solo para POLL) -->
      <div v-if="announcement.type === 'POLL' && announcement.options?.length" class="space-y-3 pt-3 border-t border-muted/30">
        <div class="flex items-center justify-between text-xs font-semibold text-muted">
          <span>Resultados de la votación</span>
          <span class="text-primary font-bold">
            {{ announcement.totalVotes ?? 0 }} {{ (announcement.totalVotes ?? 0) === 1 ? 'voto total' : 'votos totales' }}
          </span>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="opt in announcement.options"
            :key="opt.id"
            class="space-y-1 bg-muted/20 p-2.5 rounded-lg border border-muted/40"
          >
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium text-default">{{ opt.label }}</span>
              <span class="text-xs font-bold text-muted">
                {{ opt.voteCount }} {{ opt.voteCount === 1 ? 'voto' : 'votos' }}
                ({{ (announcement.totalVotes ?? 0) > 0 ? Math.round((opt.voteCount / (announcement.totalVotes || 1)) * 100) : 0 }}%)
              </span>
            </div>

            <!-- Barra de progreso -->
            <div class="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
              <div
                class="bg-primary h-2 rounded-full transition-all duration-500"
                :style="{
                  width: `${(announcement.totalVotes ?? 0) > 0 ? Math.round((opt.voteCount / (announcement.totalVotes || 1)) * 100) : 0}%`
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
