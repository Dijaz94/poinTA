<script setup lang="ts">
import type { Announcement } from '~/types/announcements'
import PollCard from '~/components/PollCard.vue'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)

const { data: announcements, status, error, refresh } = await useFetch<Announcement[]>('/api/announcements', {
  query: { subjectId },
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-2xl font-bold text-highlighted">Anuncios y Votaciones</h2>
        <p class="text-sm text-muted">Avisos importantes y consultas activas del equipo docente</p>
      </div>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-heroicons-exclamation-triangle"
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

    <div v-else-if="status === 'pending'" class="space-y-4">
      <UCard v-for="i in 2" :key="i" class="w-full">
        <div class="space-y-4">
          <USkeleton class="h-6 w-1/3" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-5/6" />
        </div>
      </UCard>
    </div>

    <div v-else-if="announcements?.length === 0" class="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-muted">
      <UIcon name="i-heroicons-megaphone" class="text-4xl text-muted mb-4" />
      <h3 class="text-lg font-semibold text-highlighted mb-2">No hay anuncios ni votaciones</h3>
      <p class="text-muted max-w-sm mx-auto">
        Aún no se han publicado avisos para esta asignatura. Vuelve a revisar más tarde.
      </p>
    </div>

    <div v-else class="space-y-6">
      <template v-for="announcement in announcements" :key="announcement.id">
        <!-- Votación -->
        <PollCard
          v-if="announcement.type === 'POLL'"
          :announcement="announcement"
          @voted="() => refresh()"
        />

        <!-- Comunicado tradicional -->
        <UCard
          v-else
          :ui="{
            root: 'overflow-hidden border-l-4 border-l-primary',
            header: 'pb-2 bg-muted/10',
            body: 'pt-4',
          }"
        >
          <template #header>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div class="flex items-center gap-2">
                <UBadge color="neutral" variant="subtle" size="xs">
                  <UIcon name="i-heroicons-megaphone" class="size-3 mr-1" />
                  Comunicado
                </UBadge>
                <h3 class="font-bold text-lg text-default">{{ announcement.title }}</h3>
              </div>
              <div class="flex items-center gap-1.5 text-xs text-muted whitespace-nowrap">
                <UIcon name="i-heroicons-clock" class="size-3.5" />
                {{ formatDateTime(announcement.createdAt) }}
              </div>
            </div>
          </template>

          <p class="text-default whitespace-pre-wrap leading-relaxed">{{ announcement.content }}</p>
        </UCard>
      </template>
    </div>
  </div>
</template>