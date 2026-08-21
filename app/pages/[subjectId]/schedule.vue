<script setup lang="ts">
import type { Session } from '~/types/sessions'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)

const { data: sessions, status, error, refresh } = await useFetch<Session[]>('/api/schedule', {
  query: { subjectId },
})

const recurringSessions = computed(() => {
  return sessions.value?.filter((s) => s.isRecurring) || []
})

const extraordinarySessions = computed(() => {
  return sessions.value?.filter((s) => !s.isRecurring) || []
})

const sortedRecurringSessions = computed(() => {
  return [...recurringSessions.value].sort((a, b) => {
    const dayA = DAY_ORDERS[a.dayOfWeek!] ?? 99
    const dayB = DAY_ORDERS[b.dayOfWeek!] ?? 99
    if (dayA !== dayB) return dayA - dayB
    return a.startTime.localeCompare(b.startTime)
  })
})
</script>

<template>
  <div class="space-y-12">
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="No se pudo cargar el horario."
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar la plataforma.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <template v-else>
      <!-- Horarios Recurrentes -->
      <section>
        <div class="flex items-center gap-3 mb-6">
          <UIcon name="i-lucide-refresh-cw" class="text-2xl text-primary" />
          <h2 class="text-2xl font-bold text-highlighted">Horarios Semanales</h2>
        </div>

        <div v-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <USkeleton v-for="i in 3" :key="i" class="h-40 w-full rounded-xl" />
        </div>

        <div v-else-if="recurringSessions.length === 0" class="text-center py-12 bg-muted/20 rounded-2xl">
          <p class="text-muted">Aún no se han definido los horarios recurrentes de ayudantía.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UCard
            v-for="session in sortedRecurringSessions"
            :key="session.id"
            :ui="{ root: 'border-t-4 border-t-primary shadow-sm' }"
          >
            <div class="flex items-center justify-between mb-4">
              <span class="font-bold text-lg text-primary">{{ dayLabel(session.dayOfWeek) }}</span>
              <UBadge color="neutral" variant="soft">{{ session.startTime }} - {{ session.endTime }}</UBadge>
            </div>

            <h3 class="font-semibold text-default mb-2">{{ session.title }}</h3>

            <div v-if="session.location" class="flex items-center gap-2 text-sm text-muted">
              <UIcon name="i-lucide-map-pin" class="size-4" />
              {{ session.location }}
            </div>
          </UCard>
        </div>
      </section>

      <!-- Sesiones Extraordinarias -->
      <section>
        <div class="flex items-center gap-3 mb-6">
          <UIcon name="i-lucide-star" class="text-2xl text-warning" />
          <h2 class="text-2xl font-bold text-highlighted">Sesiones Extraordinarias</h2>
        </div>

        <div v-if="status === 'pending'" class="space-y-4">
          <USkeleton v-for="i in 2" :key="i" class="h-24 w-full rounded-xl" />
        </div>

        <div v-else-if="extraordinarySessions.length === 0" class="text-center py-12 bg-muted/20 rounded-2xl">
          <p class="text-muted">No hay sesiones extraordinarias programadas por el momento.</p>
        </div>

        <div v-else class="space-y-4">
          <UCard
            v-for="session in extraordinarySessions"
            :key="session.id"
            :ui="{ root: 'border-l-4 border-l-warning' }"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 class="font-bold text-lg text-default">{{ session.title }}</h3>
                <div class="flex items-center gap-4 mt-2 text-sm text-muted">
                  <div v-if="session.date" class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-calendar-days" class="size-4" />
                    <span class="capitalize">{{ formatFullDate(session.date) }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-clock" class="size-4" />
                    {{ session.startTime }} - {{ session.endTime }}
                  </div>
                </div>
              </div>

              <div v-if="session.location" class="flex items-center gap-1.5 text-sm font-medium bg-muted/10 px-3 py-1.5 rounded-lg text-default self-start sm:self-auto">
                <UIcon name="i-lucide-map-pin" class="size-4 text-warning" />
                {{ session.location }}
              </div>
            </div>
          </UCard>
        </div>
      </section>
    </template>
  </div>
</template>