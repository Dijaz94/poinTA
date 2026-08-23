<script setup lang="ts">
import { computed } from 'vue'
import type { Session } from '~/types/sessions'
import { DAYS } from '~/utils/days'
import SessionCard from '~/components/SessionCard.vue'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)

const { data: sessions, status, error, refresh } = await useFetch<Session[]>(
  () => `/api/schedule?subjectId=${subjectId.value}`
)

const columns = computed<Record<string, Session[]>>(() => {
  const map: Record<string, Session[]> = {}
  for (const d of DAYS) map[d.value] = []
  for (const s of (sessions.value ?? []) as any[]) {
    if (s.isRecurring && s.dayOfWeek && map[s.dayOfWeek]) {
      map[s.dayOfWeek]!.push(s)
    }
  }
  return map
})

const extraordinarySessions = computed(() =>
  (sessions.value ?? []).filter((s) => !s.isRecurring),
)
</script>

<template>
  <div class="space-y-10">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-highlighted">Horario Semanal</h2>
        <p class="text-sm text-muted">Bloques de ayudantías semanales y sesiones extraordinarias</p>
      </div>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="No se pudo cargar el horario."
      class="mb-6"
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar la plataforma.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <!-- Skeleton de carga -->
    <div v-else-if="status === 'pending'" class="grid grid-cols-7 gap-3">
      <div v-for="d in 7" :key="d" class="space-y-3">
        <div v-for="i in 2" :key="i">
          <USkeleton class="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>

    <!-- Kanban -->
    <template v-else>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div
          v-for="d in DAYS"
          :key="d.value"
          class="min-h-[180px] rounded-xl bg-muted/30 border border-muted/50 p-2 flex flex-col gap-2"
        >
          <span class="text-xs font-bold text-highlighted uppercase tracking-wider px-1 pb-1 border-b border-muted/40 text-center">
            {{ d.label }}
          </span>

          <div class="flex-1 flex flex-col gap-2">
            <SessionCard
              v-for="session in columns[d.value]"
              :key="session.id"
              :session="session"
              variant="kanban"
            />
          </div>
        </div>
      </div>

      <!-- Sesiones extraordinarias -->
      <section>
        <div class="flex items-center gap-3 mb-4">
          <UIcon name="i-lucide-star" class="text-xl text-warning" />
          <h3 class="text-lg font-bold text-highlighted">Sesiones Extraordinarias</h3>
        </div>

        <div
          v-if="extraordinarySessions.length === 0"
          class="text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-muted"
        >
          <p class="text-muted text-sm">No hay sesiones extraordinarias registradas.</p>
        </div>

        <div v-else class="space-y-3">
          <SessionCard
            v-for="session in extraordinarySessions"
            :key="session.id"
            :session="session"
            variant="extraordinary"
          />
        </div>
      </section>
    </template>
  </div>
</template>