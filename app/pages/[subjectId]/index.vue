<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Announcement } from '~/types/announcements'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)

const { data: announcements, status, error, refresh } = await useFetch<Announcement[]>(
  () => `/api/announcements?subjectId=${subjectId.value}`,
  {
    key: () => `announcements-${subjectId.value}`,
  }
)

const activeFilter = ref<'ALL' | 'COMMUNICATION' | 'POLL'>('ALL')

const filteredAnnouncements = computed(() => {
  if (!announcements.value) return []
  if (activeFilter.value === 'ALL') return announcements.value
  return announcements.value.filter(a => a.type === activeFilter.value)
})

const counts = computed(() => {
  const list = announcements.value ?? []
  return {
    all: list.length,
    communication: list.filter(a => a.type === 'COMMUNICATION').length,
    poll: list.filter(a => a.type === 'POLL').length,
  }
})

function formatIndex(idx: number): string {
  return String(idx + 1).padStart(2, '0')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Cabecera de Sección con Filtro de Registro -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--atelier-border)]">
      <div>
        <span class="atelier-tag text-muted block mb-1">
          SECCIÓN 01 // BITÁCORA Y CONSULTAS
        </span>
        <h2 class="font-editorial text-2xl sm:text-3xl font-medium text-highlighted">
          Anuncios y <span class="italic font-normal text-[var(--atelier-cobalt)]">votaciones</span>
        </h2>
      </div>

      <!-- Selector de Filtro Técnico (Áreas táctiles >= 44px) -->
      <div
        v-if="announcements && announcements.length > 0"
        role="tablist"
        aria-label="Filtrar publicaciones"
        class="inline-flex items-center p-1 rounded-[8px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)] self-start sm:self-auto"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="activeFilter === 'ALL'"
          class="inline-flex items-center gap-1.5 px-3 min-h-[38px] rounded-[6px] font-tech text-xs transition-colors"
          :class="activeFilter === 'ALL'
            ? 'bg-[var(--atelier-cobalt)] text-white font-semibold'
            : 'text-toned hover:text-highlighted'"
          @click="activeFilter = 'ALL'"
        >
          <span>TODOS</span>
          <span class="opacity-80">({{ counts.all }})</span>
        </button>

        <button
          type="button"
          role="tab"
          :aria-selected="activeFilter === 'COMMUNICATION'"
          class="inline-flex items-center gap-1.5 px-3 min-h-[38px] rounded-[6px] font-tech text-xs transition-colors"
          :class="activeFilter === 'COMMUNICATION'
            ? 'bg-[var(--atelier-cobalt)] text-white font-semibold'
            : 'text-toned hover:text-highlighted'"
          @click="activeFilter = 'COMMUNICATION'"
        >
          <span>AVISOS</span>
          <span class="opacity-80">({{ counts.communication }})</span>
        </button>

        <button
          type="button"
          role="tab"
          :aria-selected="activeFilter === 'POLL'"
          class="inline-flex items-center gap-1.5 px-3 min-h-[38px] rounded-[6px] font-tech text-xs transition-colors"
          :class="activeFilter === 'POLL'
            ? 'bg-[var(--atelier-terracotta-solid)] text-white font-semibold'
            : 'text-toned hover:text-highlighted'"
          @click="activeFilter = 'POLL'"
        >
          <span>VOTACIONES</span>
          <span class="opacity-80">({{ counts.poll }})</span>
        </button>
      </div>
    </div>

    <!-- Estado de Error -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="No se pudieron cargar los anuncios."
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar la bitácora de la asignatura.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <!-- Estado de Carga -->
    <div v-else-if="status === 'pending'" class="space-y-4">
      <div v-for="i in 2" :key="i" class="atelier-card p-5 space-y-3">
        <USkeleton class="h-5 w-1/3" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-5/6" />
      </div>
    </div>

    <!-- Estado Vacío -->
    <div
      v-else-if="announcements?.length === 0"
      class="text-center py-14 px-4 rounded-[8px] border border-dashed border-[var(--atelier-border-strong)] bg-[var(--atelier-surface)]/50"
    >
      <UIcon name="i-lucide-megaphone" class="size-8 text-muted mb-3 mx-auto" />
      <h3 class="font-editorial text-xl text-highlighted mb-1">Bitácora sin publicaciones</h3>
      <p class="text-sm text-muted max-w-sm mx-auto">
        Aún no se han registrado comunicados ni votaciones para esta asignatura.
      </p>
    </div>

    <div
      v-else-if="filteredAnnouncements.length === 0"
      class="text-center py-12 px-4 rounded-[8px] border border-dashed border-[var(--atelier-border-strong)] bg-[var(--atelier-surface)]/50"
    >
      <p class="text-sm text-muted">No hay publicaciones en esta categoría.</p>
    </div>

    <!-- Lista de Anuncios con Index Spine (Columna Vertebral de Grilla y Numeración) -->
    <div v-else class="relative sm:pl-12 space-y-5">
      <!-- Línea vertical del Index Spine (visible en sm+) -->
      <div
        class="hidden sm:block absolute left-4 top-2 bottom-2 w-[1px] bg-[var(--atelier-border-strong)]"
        aria-hidden="true"
      />

      <div
        v-for="(item, idx) in filteredAnnouncements"
        :id="item.type === 'POLL' ? `poll-${item.id}` : undefined"
        :key="item.id"
        class="relative scroll-mt-24"
      >
        <!-- Nodo numérico del Index Spine -->
        <div
          class="hidden sm:flex items-center justify-center absolute -left-12 top-3 w-8 h-6 rounded-[4px] border font-tech text-[11px] font-semibold"
          :class="item.type === 'POLL'
            ? 'bg-[var(--atelier-terracotta-soft)] border-[var(--atelier-terracotta-border)] text-[var(--atelier-terracotta)]'
            : 'bg-[var(--atelier-surface)] border-[var(--atelier-border)] text-toned'"
          aria-hidden="true"
        >
          {{ formatIndex(idx) }}
        </div>

        <AnnouncementCard
          v-if="item.type === 'COMMUNICATION'"
          :announcement="item"
          :index="formatIndex(idx)"
        />
        <PollCard
          v-else-if="item.type === 'POLL'"
          :announcement="item"
          :index="formatIndex(idx)"
          @voted="refresh"
        />
      </div>
    </div>
  </div>
</template>