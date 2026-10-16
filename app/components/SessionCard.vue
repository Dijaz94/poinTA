<script setup lang="ts">
import { computed } from 'vue'
import type { Session } from '~/types/sessions'
import { downloadSessionIcs, buildGoogleCalendarUrl } from '~/utils/calendar'

const props = withDefaults(
  defineProps<{
    session: Session
    variant?: 'kanban' | 'extraordinary'
    deleting?: boolean
    isAdmin?: boolean
    subjectName?: string
    index?: string | number
  }>(),
  {
    variant: 'kanban',
    deleting: false,
    isAdmin: false,
    subjectName: undefined,
    index: undefined,
  }
)

const emit = defineEmits<{
  edit: [session: Session]
  delete: [session: Session]
}>()

const gcalUrl = computed(() => buildGoogleCalendarUrl(props.session, props.subjectName))

const handleDownloadIcs = () => {
  downloadSessionIcs(props.session, props.subjectName)
}
</script>

<template>
  <!-- Variante Extraordinaria (Fila de Agenda con Fecha Puntual) -->
  <article
    v-if="variant === 'extraordinary'"
    :data-id="session.id"
    class="atelier-card atelier-card-terracotta p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
  >
    <div class="space-y-1.5 min-w-0">
      <div class="flex flex-wrap items-center gap-2">
        <span
          v-if="index"
          class="font-tech text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-[var(--atelier-terracotta-soft)] text-[var(--atelier-terracotta)] border border-[var(--atelier-terracotta-border)]"
        >
          {{ index }}
        </span>
        <span class="atelier-tag text-[var(--atelier-terracotta)]">
          SESIÓN EXTRAORDINARIA
        </span>
        <span v-if="session.date" class="font-tech text-xs text-toned">
          // {{ formatFullDate(session.date) }}
        </span>
      </div>

      <h4 class="font-editorial text-lg sm:text-xl font-medium text-highlighted leading-snug">
        {{ session.title }}
      </h4>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-tech text-toned min-w-0">
        <span class="inline-flex items-center gap-1.5 font-semibold text-highlighted shrink-0">
          <UIcon name="i-lucide-clock" class="size-3.5 text-muted" />
          {{ session.startTime }} – {{ session.endTime }}
        </span>
        <span
          v-if="session.location"
          class="flex items-center gap-1.5 min-w-0 max-w-full"
          :title="session.location"
        >
          <UIcon name="i-lucide-map-pin" class="size-3.5 text-muted shrink-0" />
          <span class="truncate">{{ session.location }}</span>
        </span>
      </div>
    </div>

    <!-- Acciones: Exportar a Calendario (Público) o Editar/Eliminar (Admin) -->
    <div v-if="isAdmin" class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-square-pen"
        size="sm"
        class="min-w-[44px] min-h-[44px] justify-center"
        aria-label="Editar sesión"
        @click="emit('edit', session)"
      />
      <UButton
        color="error"
        variant="ghost"
        icon="i-lucide-trash"
        size="sm"
        class="min-w-[44px] min-h-[44px] justify-center"
        :loading="deleting"
        aria-label="Eliminar sesión"
        @click="emit('delete', session)"
      />
    </div>

    <div v-else class="flex items-center gap-2 shrink-0 self-start sm:self-center">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-[6px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)] hover:border-[var(--atelier-cobalt)] hover:text-[var(--atelier-cobalt)] font-tech text-xs font-medium text-toned transition-colors cursor-pointer"
        title="Descargar archivo .ics para tu calendario"
        @click="handleDownloadIcs"
      >
        <UIcon name="i-lucide-download" class="size-3.5" />
        <span>.ICS</span>
      </button>

      <a
        :href="gcalUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-[6px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)] hover:border-[var(--atelier-cobalt)] hover:text-[var(--atelier-cobalt)] font-tech text-xs font-medium text-toned transition-colors"
        title="Añadir a Google Calendar"
      >
        <UIcon name="i-lucide-calendar-plus" class="size-3.5" />
        <span>GOOGLE CAL</span>
      </a>
    </div>
  </article>

  <!-- Variante Bloque Semanal (Cinta Horaria / Kanban) -->
  <article
    v-else
    :data-id="session.id"
    class="rounded-[6px] border border-[var(--atelier-border)] border-l-2 border-l-[var(--atelier-cobalt)] bg-[var(--atelier-surface)] p-3 flex flex-col justify-between gap-2.5 min-w-0 overflow-hidden"
    :class="isAdmin ? 'cursor-grab active:cursor-grabbing' : ''"
  >
    <div class="space-y-1.5 min-w-0">
      <!-- Rango horario en monoespaciado -->
      <div class="flex items-center justify-between gap-1 min-w-0">
        <span class="inline-flex items-center gap-1 font-tech text-xs font-semibold text-highlighted truncate">
          <UIcon name="i-lucide-clock" class="size-3 text-muted shrink-0" />
          <span class="truncate">{{ session.startTime }} – {{ session.endTime }}</span>
        </span>

        <div v-if="isAdmin" class="flex items-center gap-0.5 shrink-0">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-square-pen"
            size="xs"
            aria-label="Editar"
            @click="emit('edit', session)"
          />
          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-trash"
            size="xs"
            :loading="deleting"
            aria-label="Eliminar"
            @click="emit('delete', session)"
          />
        </div>
      </div>

      <!-- Título del bloque -->
      <h4 class="font-medium text-sm text-highlighted leading-snug break-words line-clamp-2">
        {{ session.title }}
      </h4>

      <!-- Sala / Ubicación con tres puntos (…) -->
      <div
        v-if="session.location"
        class="flex items-center gap-1 min-w-0 max-w-full font-tech text-[11px] text-muted"
        :title="session.location"
      >
        <UIcon name="i-lucide-map-pin" class="size-3 text-muted shrink-0" />
        <span class="truncate block min-w-0">{{ session.location }}</span>
      </div>
    </div>

    <!-- Botones de Exportación a Calendario (Vista Estudiante) -->
    <div
      v-if="!isAdmin"
      class="pt-2 border-t border-[var(--atelier-border-muted)] flex items-center justify-between gap-1.5"
    >
      <button
        type="button"
        class="flex-1 inline-flex items-center justify-center gap-1 min-h-[36px] px-2 rounded-[4px] border border-[var(--atelier-border)] bg-[var(--atelier-surface-muted)]/40 hover:border-[var(--atelier-cobalt)] hover:text-[var(--atelier-cobalt)] font-tech text-[10px] font-medium text-toned transition-colors"
        title="Descargar evento .ics"
        @click="handleDownloadIcs"
      >
        <UIcon name="i-lucide-download" class="size-3" />
        <span>.ICS</span>
      </button>

      <a
        :href="gcalUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex-1 inline-flex items-center justify-center gap-1 min-h-[36px] px-2 rounded-[4px] border border-[var(--atelier-border)] bg-[var(--atelier-surface-muted)]/40 hover:border-[var(--atelier-cobalt)] hover:text-[var(--atelier-cobalt)] font-tech text-[10px] font-medium text-toned transition-colors"
        title="Abrir en Google Calendar"
      >
        <UIcon name="i-lucide-calendar-plus" class="size-3" />
        <span>GCAL</span>
      </a>
    </div>
  </article>
</template>
