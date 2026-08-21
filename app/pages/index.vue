<script setup lang="ts">
import type { Subject } from '~/types/subjects'
const { data: subjects, status, error, refresh } = await useFetch<Subject[]>('/api/subjects')
</script>

<template>
  <div class="min-h-screen bg-default">
    <!-- Hero Section -->
    <div class="relative overflow-hidden bg-ink-950 py-24 sm:py-32">
      <!-- Radial glow: indigo → teal -->
      <div class="absolute inset-0 -z-10" aria-hidden="true">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-indigo-700 via-teal-600 to-transparent opacity-30 blur-3xl" />
      </div>

      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl font-display">
            Plataforma de Ayudantías Informáticas
          </h1>

          <p class="mt-6 text-lg leading-8 text-ink-200">
            Encuentra todo el material, anuncios y horarios de las sesiones de ayudantía para tus asignaturas, organizado en un solo lugar.
          </p>
        </div>
      </div>
    </div>

    <!-- Subjects Grid -->
    <div class="mx-auto max-w-7xl px-6 lg:px-8 py-16">
      <h2 class="text-2xl font-bold text-default mb-8">Selecciona tu Asignatura</h2>
      
      <div v-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <USkeleton v-for="i in 3" :key="i" class="h-32 w-full rounded-xl" />
      </div>

      <div v-else-if="subjects?.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-book-open" class="text-4xl text-muted mb-4 mx-auto" />
        <p class="text-muted">Aún no hay asignaturas registradas para este semestre.</p>
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        title="No se pudieron cargar las asignaturas."
        class="max-w-2xl mx-auto"
      >
        <template #description>
          <div class="flex items-center justify-between gap-4">
            <span>Ocurrió un error al consultar la plataforma.</span>
            <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
          </div>
        </template>
      </UAlert>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink 
          v-for="subject in subjects" 
          :key="subject.id"
          :to="`/${subject.id}`"
          class="group relative"
        >
          <UCard 
            :ui="{ 
              root: 'transition-all duration-200 hover:-translate-y-1 hover:shadow-xl border border-transparent hover:border-primary/20',
              body: 'flex flex-col h-full justify-between gap-4 p-6'
            }"
          >
            <div>
              <div class="flex items-center justify-between mb-2">
                <UBadge color="secondary" variant="soft" size="sm">
                  {{ subject.semester }}
                </UBadge>
                <span class="text-sm font-mono text-muted">{{ subject.code }}</span>
              </div>
              <h3 class="text-xl font-bold text-highlighted group-hover:text-primary transition-colors">
                {{ subject.name }}
              </h3>
              <span v-if="subject.users?.length !== 0 && subject.users?.length !== 1" class="text-sm font-mono text-muted">Ayudantes: {{ subject.users?.map((u) => u.name).join(', ') }}</span>
              <span v-else-if="subject.users?.length === 1" class="text-sm font-mono text-muted">Ayudante: {{ subject.users?.map((u) => u.name).join(', ') }}</span>
            </div>
            
            <div class="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Ver detalles 
              <UIcon name="i-heroicons-arrow-right-20-solid" class="ml-1 size-4" />
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
