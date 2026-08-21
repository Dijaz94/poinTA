<script setup lang="ts">
const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)

const { data: subject, status, error } = await useFetch(
  () => `/api/subjects/${subjectId.value}`,
)

const links = computed(() => [
  {
    label: 'Anuncios',
    icon: 'i-lucide-megaphone',
    to: `/${subjectId.value}`,
  },
  {
    label: 'Materiales',
    icon: 'i-lucide-folder',
    to: `/${subjectId.value}/materials`,
  },
  {
    label: 'Horario',
    icon: 'i-lucide-calendar',
    to: `/${subjectId.value}/schedule`,
  },
])
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-elevated border-b border-muted sticky top-16 z-40">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <UButton
            to="/"
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            aria-label="Volver al inicio"
          />

          <div v-if="status === 'pending'" class="flex items-center gap-3">
            <USkeleton class="h-6 w-32" />
            <USkeleton class="h-5 w-16" />
          </div>

          <div v-else-if="subject" class="flex items-center gap-3">
            <h1 class="text-xl font-bold text-highlighted truncate max-w-[200px] sm:max-w-md font-display">
              {{ subject.name }}
            </h1>
            <UBadge color="neutral" variant="subtle" size="sm" class="hidden sm:inline-flex">
              {{ subject.code }}
            </UBadge>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <UNavigationMenu :items="links" class="border-b-0" />
      </div>
    </header>

    <!-- Page Content -->
    <main class="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-lucide-triangle-alert"
        title="No se pudo cargar esta asignatura."
        :description="error.statusMessage ?? 'Intenta nuevamente en unos instantes.'"
      />
      <NuxtPage v-else :subject="subject" />
    </main>
  </div>
</template>