<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { data: subjects, status, error, refresh } = await useFetch('/api/subjects', {
  query: { mine: 'true' },
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight text-highlighted font-display">Mis Asignaturas</h1>
      <p class="mt-2 text-muted">
        Selecciona una asignatura para gestionar sus anuncios, materiales y horarios.
      </p>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-heroicons-exclamation-triangle"
      title="No se pudieron cargar tus asignaturas."
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar la plataforma.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="refresh">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <div v-else-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <USkeleton v-for="i in 3" :key="i" class="h-40 w-full rounded-xl" />
    </div>

    <div
      v-else-if="subjects?.length === 0"
      class="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-muted"
    >
      <UIcon name="i-heroicons-academic-cap" class="text-4xl text-muted mb-4 mx-auto" />
      <h3 class="text-lg font-semibold text-highlighted mb-2">Aún no administras asignaturas</h3>
      <p class="text-muted max-w-sm mx-auto">
        Pídele a un administrador que te asigne una asignatura para comenzar a gestionar su contenido.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="subject in subjects"
        :key="subject.id"
        :ui="{
          base: 'transition-all duration-200 hover:-translate-y-1 hover:shadow-xl border border-transparent hover:border-secondary/30',
          body: 'flex flex-col h-full justify-between gap-4 p-6',
        }"
      >
        <div>
          <div class="flex items-center justify-between mb-2">
            <UBadge color="secondary" variant="soft" size="sm">{{ subject.semester }}</UBadge>
            <span class="text-sm font-mono text-muted">{{ subject.code }}</span>
          </div>
          <h2 class="text-xl font-bold text-highlighted">{{ subject.name }}</h2>
        </div>

        <div class="flex flex-col gap-2">
          <UButton
            :to="`/admin/${subject.id}/announcements`"
            color="primary"
            block
            icon="i-heroicons-wrench-screwdriver"
            label="Administrar"
            size="sm"
          />
          <UButton
            :to="`/${subject.id}`"
            color="neutral"
            variant="ghost"
            block
            icon="i-heroicons-eye"
            label="Ver página pública"
            size="sm"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>