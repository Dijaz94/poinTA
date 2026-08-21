<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  subjectId: string
  subject?: { id: string; name: string; code?: string | null } | null
  status: 'pending' | 'success' | 'error' | 'idle'
  isAdmin?: boolean
}>()

const links = computed(() => [
  {
    label: 'Anuncios',
    icon: 'i-lucide-megaphone',
    to: props.isAdmin ? `/admin/${props.subjectId}/announcements` : `/${props.subjectId}`,
    exact: true,
  },
  {
    label: 'Materiales',
    icon: 'i-lucide-folder',
    to: props.isAdmin ? `/admin/${props.subjectId}/materials` : `/${props.subjectId}/materials`,
  },
  {
    label: 'Horario',
    icon: 'i-lucide-calendar-days',
    to: props.isAdmin ? `/admin/${props.subjectId}/schedule` : `/${props.subjectId}/schedule`,
  },
])
</script>

<template>
  <header class="bg-elevated border-b border-muted sticky top-16 z-40">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <UButton
          :to="isAdmin ? '/admin' : '/'"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          :aria-label="isAdmin ? 'Volver al dashboard' : 'Volver al inicio'"
        />

        <div v-if="status === 'pending'" class="flex items-center gap-3">
          <USkeleton class="h-6 w-32" />
          <USkeleton class="h-5 w-16" />
        </div>

        <div v-else-if="subject" class="flex items-center gap-3">
          <h1 class="text-xl font-bold text-highlighted truncate max-w-[220px] sm:max-w-md font-display">
            {{ subject.name }}
          </h1>
          <UBadge color="neutral" variant="subtle" size="sm" class="hidden sm:inline-flex">
            {{ subject.code }}
          </UBadge>
        </div>
      </div>

      <UButton
        v-if="subject && isAdmin"
        :to="`/${subject.id}`"
        color="secondary"
        variant="soft"
        size="sm"
        icon="i-lucide-eye"
        label="Ver público"
        class="hidden sm:inline-flex"
      />
    </div>

    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <UNavigationMenu :items="links" class="border-b-0" />
    </div>
  </header>
</template>
