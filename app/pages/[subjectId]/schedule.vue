<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Session } from '~/types/sessions'
import type { Subject } from '~/types/subjects'
import { DAYS } from '~/utils/days'
import { getCurrentDayEnum } from '~/utils/calendar'
import SessionCard from '~/components/SessionCard.vue'

const props = defineProps<{
  subject?: Subject | null
}>()

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)

const { data: sessions, status, error, refresh } = await useFetch<Session[]>(
  () => `/api/schedule?subjectId=${subjectId.value}`,
  {
    key: () => `schedule-${subjectId.value}`,
  }
)

const todayEnum = getCurrentDayEnum()
const activeMobileDay = ref<string>(todayEnum)

const SHORT_LABELS: Record<string, string> = {
  MONDAY: 'LUN',
  TUESDAY: 'MAR',
  WEDNESDAY: 'MIÉ',
  THURSDAY: 'JUE',
  FRIDAY: 'VIE',
  SATURDAY: 'SÁB',
  SUNDAY: 'DOM',
}

const columns = computed<Record<string, Session[]>>(() => {
  const map: Record<string, Session[]> = {}
  for (const d of DAYS) map[d.value] = []
  for (const s of (sessions.value ?? [])) {
    if (s.isRecurring && s.dayOfWeek && map[s.dayOfWeek]) {
      map[s.dayOfWeek]!.push(s)
    }
  }
  // Ordenar cada día por hora de inicio
  for (const k of Object.keys(map)) {
    map[k]!.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }
  return map
})

const extraordinarySessions = computed(() =>
  (sessions.value ?? []).filter(s => !s.isRecurring)
)

const weekendEmpty = computed(() => {
  return (
    (columns.value.SATURDAY?.length ?? 0) === 0
    && (columns.value.SUNDAY?.length ?? 0) === 0
  )
})

const isTodayWeekend = computed(() => {
  return todayEnum === 'SATURDAY' || todayEnum === 'SUNDAY'
})

// Días a mostrar en la Cinta Horaria Proporcional de escritorio
const desktopColumns = computed(() => {
  const weekdays = DAYS.slice(0, 5).map(d => ({
    key: d.value,
    label: d.label,
    shortLabel: SHORT_LABELS[d.value] ?? d.label,
    isToday: d.value === todayEnum,
    isCollapsedWeekend: false,
    sessions: columns.value[d.value] ?? [],
  }))

  // Si sábado y domingo están vacíos y hoy no es fin de semana, agrupar/colapsar
  if (weekendEmpty.value && !isTodayWeekend.value) {
    return [
      ...weekdays,
      {
        key: 'WEEKEND_COLLAPSED',
        label: 'Sáb / Dom',
        shortLabel: 'FIN DE SEMANA',
        isToday: false,
        isCollapsedWeekend: true,
        sessions: [] as Session[],
      },
    ]
  }

  const weekend = DAYS.slice(5).map(d => ({
    key: d.value,
    label: d.label,
    shortLabel: SHORT_LABELS[d.value] ?? d.label,
    isToday: d.value === todayEnum,
    isCollapsedWeekend: false,
    sessions: columns.value[d.value] ?? [],
  }))

  return [...weekdays, ...weekend]
})

// Proporciones CSS Grid para que el día actual ocupe más ancho y el fin de semana vacío se compacte
const desktopGridStyle = computed(() => {
  const template = desktopColumns.value
    .map((col) => {
      if (col.isToday) return 'minmax(210px, 1.65fr)'
      if (col.isCollapsedWeekend) return 'minmax(110px, 0.65fr)'
      return 'minmax(145px, 1fr)'
    })
    .join(' ')
  return {
    gridTemplateColumns: template,
  }
})

// Navegación Móvil de Un Solo Día + Swipe Horizontal
const activeMobileDayObj = computed(() => {
  return DAYS.find(d => d.value === activeMobileDay.value) ?? DAYS[0]
})

const activeMobileSessions = computed(() => {
  return columns.value[activeMobileDay.value] ?? []
})

function stepMobileDay(delta: number) {
  const idx = DAYS.findIndex(d => d.value === activeMobileDay.value)
  if (idx === -1) return
  const nextIdx = (idx + delta + DAYS.length) % DAYS.length
  activeMobileDay.value = DAYS[nextIdx]!.value
}

const touchStartX = ref(0)
const touchStartY = ref(0)

function onTouchStart(e: TouchEvent) {
  const t = e.changedTouches[0]
  if (!t) return
  touchStartX.value = t.clientX
  touchStartY.value = t.clientY
}

function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0]
  if (!t) return
  const dx = t.clientX - touchStartX.value
  const dy = t.clientY - touchStartY.value
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    if (dx < 0) {
      stepMobileDay(1)
    } else {
      stepMobileDay(-1)
    }
  }
}

function formatIndex(idx: number): string {
  return String(idx + 1).padStart(2, '0')
}
</script>

<template>
  <div class="space-y-10">
    <!-- Cabecera de Sección -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--atelier-border)]">
      <div>
        <span class="atelier-tag text-muted block mb-1">
          SECCIÓN 03 // CRONOGRAMA DE SESIONES
        </span>
        <h2 class="font-editorial text-2xl sm:text-3xl font-medium text-highlighted">
          Cinta <span class="italic font-normal text-[var(--atelier-cobalt)]">horaria</span> semanal
        </h2>
      </div>

      <div class="flex items-center gap-3 font-tech text-xs text-muted">
        <span class="inline-flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-[var(--atelier-cobalt)]" aria-hidden="true" />
          DÍA ACTUAL EXPANDIDO
        </span>
        <span class="text-[var(--atelier-border-strong)]">·</span>
        <span>EXPORTACIÓN .ICS / GCAL</span>
      </div>
    </div>

    <!-- Error -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="No se pudo cargar el horario."
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar los bloques horarios.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <!-- Skeleton -->
    <div v-else-if="status === 'pending'" class="grid grid-cols-1 lg:grid-cols-6 gap-3">
      <USkeleton v-for="d in 6" :key="d" class="h-48 w-full rounded-[8px]" />
    </div>

    <template v-else>
      <!-- ===============================================================
           VISTA MÓVIL (< lg): Un Solo Día con Swipe Horizontal
           =============================================================== -->
      <div class="lg:hidden space-y-3">
        <!-- Cinta de Selección de Día (Áreas táctiles >= 44px) -->
        <div
          role="tablist"
          aria-label="Seleccionar día de la semana"
          class="grid grid-cols-7 gap-1 p-1 rounded-[8px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)]"
        >
          <button
            v-for="d in DAYS"
            :key="`mob-tab-${d.value}`"
            type="button"
            role="tab"
            :aria-selected="activeMobileDay === d.value"
            class="relative flex flex-col items-center justify-center min-h-[48px] rounded-[6px] font-tech text-[11px] transition-colors"
            :class="activeMobileDay === d.value
              ? 'bg-[var(--atelier-cobalt)] text-white font-semibold'
              : (d.value === todayEnum
                ? 'bg-[var(--atelier-cobalt-soft)] text-[var(--atelier-cobalt)] font-semibold'
                : 'text-toned hover:text-highlighted')"
            @click="activeMobileDay = d.value"
          >
            <span>{{ SHORT_LABELS[d.value] }}</span>
            <!-- Indicador de sesiones en ese día -->
            <span
              v-if="(columns[d.value]?.length ?? 0) > 0"
              class="mt-1 size-1.5 rounded-full"
              :class="activeMobileDay === d.value ? 'bg-white' : 'bg-[var(--atelier-lichen-solid)]'"
              aria-hidden="true"
            />
          </button>
        </div>

        <!-- Panel del Día Activo con Soporte Swipe Horizontal -->
        <div
          class="atelier-card overflow-hidden"
          @touchstart.passive="onTouchStart"
          @touchend.passive="onTouchEnd"
        >
          <!-- Barra superior del día en móvil -->
          <div class="px-4 py-3 border-b border-[var(--atelier-border)] bg-[var(--atelier-surface-muted)]/50 flex items-center justify-between gap-2">
            <button
              type="button"
              class="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -my-1.5 -ml-2 rounded-[6px] text-toned hover:text-highlighted hover:bg-[var(--atelier-surface)] transition-colors"
              aria-label="Día anterior"
              @click="stepMobileDay(-1)"
            >
              <UIcon name="i-lucide-chevron-left" class="size-4" />
            </button>

            <div class="text-center">
              <div class="flex items-center justify-center gap-2">
                <h3 class="font-editorial text-xl font-medium text-highlighted">
                  {{ activeMobileDayObj.label }}
                </h3>
                <span
                  v-if="activeMobileDayObj.value === todayEnum"
                  class="font-tech text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-[var(--atelier-cobalt)] text-white"
                >
                  HOY
                </span>
              </div>
              <p class="font-tech text-[10px] text-muted uppercase">
                DESLIZA HORIZONTALMENTE PARA CAMBIAR DE DÍA
              </p>
            </div>

            <button
              type="button"
              class="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -my-1.5 -mr-2 rounded-[6px] text-toned hover:text-highlighted hover:bg-[var(--atelier-surface)] transition-colors"
              aria-label="Día siguiente"
              @click="stepMobileDay(1)"
            >
              <UIcon name="i-lucide-chevron-right" class="size-4" />
            </button>
          </div>

          <!-- Lista de sesiones del día seleccionado -->
          <div class="p-4 space-y-3 min-h-[180px] flex flex-col justify-center">
            <template v-if="activeMobileSessions.length > 0">
              <SessionCard
                v-for="session in activeMobileSessions"
                :key="session.id"
                :session="session"
                :subject-name="props.subject?.name"
                variant="kanban"
              />
            </template>

            <div v-else class="text-center py-8">
              <p class="font-tech text-xs text-muted uppercase">
                SIN BLOQUES REGISTRADOS PARA {{ activeMobileDayObj.label.toUpperCase() }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===============================================================
           VISTA DESKTOP (>= lg): Cinta Horaria Proporcional
           =============================================================== -->
      <div
        class="hidden lg:grid gap-3 items-stretch"
        :style="desktopGridStyle"
      >
        <div
          v-for="col in desktopColumns"
          :key="col.key"
          class="min-w-0 min-h-[240px] rounded-[8px] border flex flex-col overflow-hidden transition-colors"
          :class="[
            col.isToday
              ? 'border-[var(--atelier-cobalt)] bg-[var(--atelier-cobalt-soft)]/25 shadow-[var(--atelier-shadow-cobalt)]'
              : (col.isCollapsedWeekend
                ? 'border-dashed border-[var(--atelier-border)] bg-[var(--atelier-surface-muted)]/25 opacity-80'
                : 'border-[var(--atelier-border)] bg-[var(--atelier-surface)]'),
          ]"
        >
          <!-- Cabecera de Columna de Día -->
          <div
            class="px-3 py-2.5 border-b flex items-center justify-between gap-1.5 min-w-0"
            :class="col.isToday
              ? 'bg-[var(--atelier-cobalt)] text-white border-[var(--atelier-cobalt)]'
              : 'bg-[var(--atelier-surface-muted)]/55 border-[var(--atelier-border-muted)] text-highlighted'"
          >
            <span class="font-tech text-xs font-semibold uppercase tracking-wider truncate">
              {{ col.label }}
            </span>

            <span
              v-if="col.isToday"
              class="font-tech text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] bg-white/20 text-white shrink-0"
            >
              HOY
            </span>
            <span
              v-else-if="col.sessions.length > 0"
              class="font-tech text-[10px] text-muted shrink-0"
            >
              {{ col.sessions.length }}
            </span>
          </div>

          <!-- Cuerpo de la Columna -->
          <div class="flex-1 p-2.5 flex flex-col gap-2.5 min-w-0">
            <template v-if="col.isCollapsedWeekend">
              <div class="flex-1 flex flex-col items-center justify-center text-center p-2">
                <span class="font-tech text-[10px] text-muted uppercase tracking-wider">
                  FIN DE SEMANA LIBRE
                </span>
              </div>
            </template>

            <template v-else-if="col.sessions.length > 0">
              <SessionCard
                v-for="session in col.sessions"
                :key="session.id"
                :session="session"
                :subject-name="props.subject?.name"
                variant="kanban"
              />
            </template>

            <div v-else class="flex-1 flex items-center justify-center">
              <span class="font-tech text-[11px] text-muted/60 select-none">—</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===============================================================
           SESIONES EXTRAORDINARIAS (Con Index Spine)
           =============================================================== -->
      <section class="pt-4 space-y-4">
        <div class="flex items-center justify-between pb-2.5 border-b border-[var(--atelier-border)]">
          <div class="flex items-center gap-2.5">
            <span class="size-2 rounded-full bg-[var(--atelier-terracotta-solid)]" aria-hidden="true" />
            <h3 class="font-editorial text-xl sm:text-2xl font-medium text-highlighted">
              Sesiones <span class="italic font-normal text-[var(--atelier-terracotta)]">extraordinarias</span>
            </h3>
          </div>
          <span class="font-tech text-xs text-muted">
            {{ String(extraordinarySessions.length).padStart(2, '0') }} PROGRAMADAS
          </span>
        </div>

        <div
          v-if="extraordinarySessions.length === 0"
          class="text-center py-10 px-4 rounded-[8px] border border-dashed border-[var(--atelier-border-strong)] bg-[var(--atelier-surface)]/40"
        >
          <p class="font-tech text-xs text-muted uppercase">
            NO HAY SESIONES EXTRAORDINARIAS REGISTRADAS EN ESTE MOMENTO
          </p>
        </div>

        <div v-else class="space-y-3">
          <SessionCard
            v-for="(session, idx) in extraordinarySessions"
            :key="session.id"
            :session="session"
            :subject-name="props.subject?.name"
            :index="formatIndex(idx)"
            variant="extraordinary"
          />
        </div>
      </section>
    </template>
  </div>
</template>