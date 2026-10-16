<script setup lang="ts">
import { computed } from 'vue'
import type { Subject } from '~/types/subjects'
import type { Session } from '~/types/sessions'
import type { Announcement } from '~/types/announcements'
import { findNextSession, formatTimeRemaining } from '~/utils/calendar'
import { isPollExpired } from '~/utils/poll'
import { usePinnedSubjects } from '~/composables/usePinnedSubjects'

const props = defineProps<{
  subjectId: string
  subject?: Subject | null
  status?: 'pending' | 'success' | 'error' | 'idle'
}>()

const { isPinned, togglePin } = usePinnedSubjects()
const pinned = computed(() => isPinned(props.subjectId))

// Reutiliza la caché de anuncios y horario de la asignatura con la misma key
const { data: sessions } = useFetch<Session[]>(
  () => `/api/schedule?subjectId=${props.subjectId}`,
  {
    key: () => `schedule-${props.subjectId}`,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  }
)

const { data: announcements } = useFetch<Announcement[]>(
  () => `/api/announcements?subjectId=${props.subjectId}`,
  {
    key: () => `announcements-${props.subjectId}`,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  }
)

const nextSession = computed(() => findNextSession(sessions.value))

const activePoll = computed(() => {
  if (!announcements.value) return null
  return announcements.value.find(
    a => a.type === 'POLL' && !isPollExpired(a.deadline)
  ) ?? null
})

const latestCommunication = computed(() => {
  if (!announcements.value) return null
  return announcements.value.find(a => a.type === 'COMMUNICATION') ?? null
})

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'TA'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}
</script>

<template>
  <section
    aria-label="Ficha contextual de la asignatura"
    class="border-b border-[var(--atelier-border)] bg-[var(--atelier-surface-muted)]/40"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
      <!-- Estado de carga -->
      <div v-if="status === 'pending'" class="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <USkeleton class="h-28 lg:col-span-5 rounded-[8px]" />
        <USkeleton class="h-28 lg:col-span-4 rounded-[8px]" />
        <USkeleton class="h-28 lg:col-span-3 rounded-[8px]" />
      </div>

      <!-- Grilla Bento de Fichas Técnicas -->
      <div v-else-if="subject" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-stretch">
        <!-- Ficha 01: Identidad de Asignatura + Equipo de Ayudantes -->
        <div class="atelier-card md:col-span-2 lg:col-span-5 p-4 flex flex-col justify-between gap-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span class="font-tech text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-[var(--atelier-cobalt-soft)] text-[var(--atelier-cobalt)] border border-[var(--atelier-cobalt-border)]">
                  {{ subject.code || 'SIN-COD' }}
                </span>
                <span class="font-tech text-[11px] text-muted uppercase">
                  SEM {{ subject.semester }}
                </span>
              </div>
              <h1 class="font-editorial text-2xl sm:text-[1.65rem] font-medium text-highlighted leading-tight">
                {{ subject.name }}
              </h1>
            </div>

            <button
              type="button"
              class="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[6px] border transition-colors shrink-0"
              :class="pinned
                ? 'bg-[var(--atelier-cobalt-soft)] border-[var(--atelier-cobalt-border)] text-[var(--atelier-cobalt)]'
                : 'bg-[var(--atelier-surface)] border-[var(--atelier-border)] text-muted hover:text-highlighted hover:border-[var(--atelier-border-strong)]'"
              :aria-label="pinned ? 'Quitar de asignaturas fijadas' : 'Fijar esta asignatura en el inicio'"
              :title="pinned ? 'Asignatura fijada' : 'Fijar asignatura'"
              @click="togglePin(subject.id)"
            >
              <UIcon :name="pinned ? 'i-lucide-pin-off' : 'i-lucide-pin'" class="size-4" />
            </button>
          </div>

          <!-- Equipo de Ayudantes -->
          <div class="pt-2.5 border-t border-[var(--atelier-border-muted)] flex flex-wrap items-center justify-between gap-2">
            <span class="atelier-tag text-muted">01 // AYUDANTES</span>

            <div v-if="subject.users?.length" class="flex flex-wrap items-center gap-2">
              <div
                v-for="ta in subject.users"
                :key="ta.id"
                class="inline-flex items-center gap-1.5 pr-2 pl-1 py-0.5 rounded-[5px] border border-[var(--atelier-border)] bg-[var(--atelier-surface-muted)]/50 text-xs text-default"
              >
                <span
                  class="inline-flex items-center justify-center size-5 rounded-[4px] bg-[var(--atelier-cobalt)] text-white font-tech text-[10px] font-semibold"
                  aria-hidden="true"
                >
                  {{ getInitials(ta.name) }}
                </span>
                <span class="font-medium truncate max-w-[140px]">{{ ta.name }}</span>
              </div>
            </div>
            <span v-else class="font-tech text-xs text-muted">
              Por asignar
            </span>
          </div>
        </div>

        <!-- Ficha 02: Próxima Ayudantía -->
        <NuxtLink
          :to="`/${subjectId}/schedule`"
          class="atelier-card atelier-card-interactive p-4 lg:col-span-4 flex flex-col justify-between gap-3 group"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="atelier-tag text-muted">02 // PRÓXIMA SESIÓN</span>
            <span
              v-if="nextSession?.isToday"
              class="font-tech text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-[var(--atelier-lichen-soft)] text-[var(--atelier-lichen)] border border-[var(--atelier-lichen-border)]"
            >
              ● HOY
            </span>
            <span
              v-else-if="nextSession"
              class="font-tech text-[11px] font-medium px-1.5 py-0.5 rounded-[4px] bg-[var(--atelier-surface-muted)] text-toned"
            >
              {{ nextSession.dayText.toUpperCase() }}
            </span>
          </div>

          <div v-if="nextSession" class="space-y-1 min-w-0">
            <div class="font-tech text-base sm:text-lg font-semibold text-highlighted flex items-center gap-2">
              <span class="truncate">{{ nextSession.dayText }} · {{ nextSession.timeRange }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-toned min-w-0">
              <span class="font-medium truncate max-w-full">{{ nextSession.session.title }}</span>
              <span
                v-if="nextSession.session.location"
                class="flex items-center gap-1 font-tech text-muted min-w-0 max-w-full"
                :title="nextSession.session.location"
              >
                <UIcon name="i-lucide-map-pin" class="size-3.5 text-[var(--atelier-lichen)] shrink-0" />
                <span class="truncate">{{ nextSession.session.location }}</span>
              </span>
            </div>
          </div>

          <div v-else class="py-1">
            <p class="text-sm font-medium text-toned">Sin bloques programados</p>
            <p class="text-xs text-muted mt-0.5">Revisa el calendario semanal para futuros horarios.</p>
          </div>

          <div class="pt-2 border-t border-[var(--atelier-border-muted)] flex items-center justify-between text-xs font-tech text-muted group-hover:text-[var(--atelier-cobalt)]">
            <span>VER CINTA HORARIA</span>
            <UIcon name="i-lucide-arrow-right" class="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </div>
        </NuxtLink>

        <!-- Ficha 03 (Interactiva): Solo cuando hay Votación Activa -->
        <NuxtLink
          v-if="activePoll"
          :to="`/${subjectId}#poll-${activePoll.id}`"
          class="atelier-card atelier-card-interactive atelier-card-terracotta bg-[var(--atelier-terracotta-soft)]/35 p-4 lg:col-span-3 flex flex-col justify-between gap-3 group"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="atelier-tag text-[var(--atelier-terracotta)] font-semibold">
              03 // VOTACIÓN ACTIVA
            </span>
            <span
              v-if="activePoll.deadline"
              class="font-tech text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-[var(--atelier-terracotta-soft)] text-[var(--atelier-terracotta)] border border-[var(--atelier-terracotta-border)]"
            >
              {{ formatTimeRemaining(activePoll.deadline) }}
            </span>
          </div>

          <div class="space-y-1">
            <p class="text-sm font-semibold text-highlighted line-clamp-2">
              {{ activePoll.title }}
            </p>
            <p class="font-tech text-xs text-[var(--atelier-terracotta)]">
              {{ activePoll.totalVotes ?? 0 }} votos registrados → Participar
            </p>
          </div>

          <div class="pt-2 border-t border-[var(--atelier-border-muted)] flex items-center justify-between text-xs font-tech text-muted group-hover:text-[var(--atelier-terracotta)]">
            <span class="truncate">EMITIR VOTO INSTITUCIONAL</span>
            <UIcon name="i-lucide-chevron-right" class="size-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
          </div>
        </NuxtLink>

        <!-- Ficha 03 (Estática): Resumen de Archivo cuando no hay votación activa -->
        <div
          v-else
          class="atelier-card p-4 lg:col-span-3 flex flex-col justify-between gap-3"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="atelier-tag text-muted">
              03 // ÍNDICE ARCHIVO
            </span>
          </div>

          <div class="grid grid-cols-3 gap-2 py-0.5">
            <div class="p-2 rounded-[6px] bg-[var(--atelier-surface-muted)]/60 border border-[var(--atelier-border-muted)]">
              <div class="font-tech text-base font-semibold text-highlighted">
                {{ subject._count?.announcements ?? announcements?.length ?? 0 }}
              </div>
              <div class="font-tech text-[10px] text-muted uppercase">Avisos</div>
            </div>
            <div class="p-2 rounded-[6px] bg-[var(--atelier-surface-muted)]/60 border border-[var(--atelier-border-muted)]">
              <div class="font-tech text-base font-semibold text-highlighted">
                {{ subject._count?.materials ?? 0 }}
              </div>
              <div class="font-tech text-[10px] text-muted uppercase">Guías</div>
            </div>
            <div class="p-2 rounded-[6px] bg-[var(--atelier-surface-muted)]/60 border border-[var(--atelier-border-muted)]">
              <div class="font-tech text-base font-semibold text-highlighted">
                {{ subject._count?.sessions ?? sessions?.length ?? 0 }}
              </div>
              <div class="font-tech text-[10px] text-muted uppercase">Bloques</div>
            </div>
          </div>

          <div class="pt-2 border-t border-[var(--atelier-border-muted)] flex items-center justify-between text-xs font-tech text-muted">
            <span class="truncate" :title="latestCommunication?.title">
              {{ latestCommunication ? `Último: ${latestCommunication.title}` : 'ARCHIVO AL DÍA' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
