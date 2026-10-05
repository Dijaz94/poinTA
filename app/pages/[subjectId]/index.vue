<script setup lang="ts">
import type { Announcement } from '~/types/announcements'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)

const { data: announcements, status, error, refresh } = await useFetch(
  () => `/api/announcements?subjectId=${subjectId.value}`,
  {
    transform: (data) => data as Announcement[],
  }
)
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-highlighted">Anuncios y Votaciones</h2>
        <p class="text-sm text-muted">Avisos importantes y consultas activas del equipo docente</p>
      </div>
    </div>

    <!-- Error state -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="No se pudieron cargar los anuncios."
      class="mb-6"
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar la plataforma.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <!-- Loading state -->
    <div v-else-if="status === 'pending'" class="space-y-4">
      <UCard v-for="i in 2" :key="i" class="w-full">
        <div class="space-y-4">
          <USkeleton class="h-6 w-1/3" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-5/6" />
        </div>
      </UCard>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="announcements?.length === 0"
      class="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-muted"
    >
      <UIcon name="i-lucide-megaphone" class="text-4xl text-muted mb-4 mx-auto" />
      <h3 class="text-lg font-semibold text-highlighted mb-2">No hay anuncios ni votaciones</h3>
      <p class="text-muted max-w-sm mx-auto">
        Aún no se han publicado avisos para esta asignatura. Vuelve a revisar más tarde.
      </p>
    </div>

    <!-- Lista de Anuncios -->
    <div v-else class="space-y-4">
      <template v-for="item in announcements" :key="item.id">
        <AnnouncementCard v-if="item.type === 'COMMUNICATION'" :announcement="item" />
        <PollCard v-else-if="item.type === 'POLL'" :announcement="item" @voted="refresh" />
      </template>
    </div>
  </div>
</template>