<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Subject } from '~/types/subjects'

const { data: subjects, status, error, refresh } = await useFetch<Subject[]>('/api/subjects')

const searchQuery = ref('')

const filteredSubjects = computed(() => {
  if (!subjects.value) return []
  if (!searchQuery.value) return subjects.value
  
  const query = searchQuery.value.toLowerCase()
  return subjects.value.filter(subject => 
    subject.name.toLowerCase().includes(query) || 
    subject.code?.toLowerCase().includes(query)
  )
})
</script>

<template>
  <div class="min-h-screen bg-default">
    <!-- Hero Section -->
    <div class="relative overflow-hidden bg-ink-950 py-24 sm:py-32 isolate">
      <!-- Dark Graph Paper Pattern -->
      <div class="absolute inset-0 -z-10 bg-[radial-gradient(#1e243d_1px,transparent_1px)] [background-size:16px_16px] opacity-70" aria-hidden="true" />

      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl font-display">
            Plataforma de Ayudantías Informáticas
          </h1>

          <p class="mt-6 text-lg leading-8 text-ink-200">
            Encuentra todo el material, anuncios y horarios de las sesiones de ayudantía para tus asignaturas, organizado en un solo lugar.
          </p>
          
          <!-- Search Input -->
          <div class="mt-10 max-w-xl mx-auto relative dark">
            <UInput 
              v-model="searchQuery"
              icon="i-heroicons-magnifying-glass-20-solid" 
              size="xl" 
              placeholder="Buscar por nombre o código de asignatura..." 
              :ui="{
                root: 'text-left',
                base: 'bg-ink-900 border-ink-800 focus:border-teal-500 text-white placeholder-ink-400 transition-colors shadow-none rounded-xl'
              }"
            >
              <template #trailing>
                <UButton
                  v-show="searchQuery !== ''"
                  color="info"
                  variant="link"
                  icon="i-heroicons-x-mark-20-solid"
                  :padded="false"
                  @click="searchQuery = ''"
                />
              </template>
            </UInput>
          </div>
        </div>
      </div>
    </div>

    <!-- Subjects Grid -->
    <div class="mx-auto max-w-7xl px-6 lg:px-8 py-16">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold text-default">
          {{ searchQuery ? 'Resultados de Búsqueda' : 'Selecciona tu Asignatura' }}
        </h2>
      </div>
      
      <div v-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <USkeleton v-for="i in 3" :key="i" class="h-32 w-full rounded-xl" />
      </div>

      <div v-else-if="subjects?.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-book-open" class="text-4xl text-muted mb-4 mx-auto" />
        <p class="text-muted">Aún no hay asignaturas registradas para este semestre.</p>
      </div>

      <div v-else-if="filteredSubjects?.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-magnifying-glass" class="text-4xl text-muted mb-4 mx-auto" />
        <p class="text-muted">No se encontraron asignaturas que coincidan con "{{ searchQuery }}".</p>
        <UButton color="neutral" variant="soft" class="mt-4" @click="searchQuery = ''">Limpiar búsqueda</UButton>
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
          v-for="subject in filteredSubjects" 
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
