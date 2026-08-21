<script setup lang="ts">
import type { Session } from '~/types/sessions'

const props = withDefaults(
  defineProps<{
    session: Session
    variant?: 'kanban' | 'extraordinary'
    deleting?: boolean
    isAdmin?: boolean
  }>(),
  {
    variant: 'kanban',
    deleting: false,
  }
)

const emit = defineEmits<{
  edit: [session: Session]
  delete: [session: Session]
}>()
</script>

<template>
  <UCard
    :data-id="session.id"
    :ui="variant === 'extraordinary' ? { root: 'border-l-4 border-l-warning' } : { root: 'cursor-grab active:cursor-grabbing border-t-2 border-t-primary shadow-sm text-sm', body: 'p-3 space-y-1.5' }"
  >
    <template v-if="variant === 'extraordinary'">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 class="font-bold text-default">{{ session.title }}</h4>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted">
            <span v-if="session.date" class="flex items-center gap-1.5">
              <UIcon name="i-lucide-calendar-days" class="size-4" />
              {{ formatFullDate(session.date) }}
            </span>
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-clock" class="size-4" />
              {{ session.startTime }} – {{ session.endTime }}
            </span>
            <span v-if="session.location" class="flex items-center gap-1.5">
              <UIcon name="i-lucide-map-pin" class="size-4" />
              {{ session.location }}
            </span>
          </div>
        </div>
        <div v-if="isAdmin" class="flex gap-1 shrink-0">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-square-pen"
            size="sm"
            aria-label="Editar"
            @click="emit('edit', session)"
          />
          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-trash"
            size="sm"
            :loading="deleting"
            aria-label="Eliminar"
            @click="emit('delete', session)"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="flex flex-col items-start justify-between gap-2">
        <span class="font-semibold text-default line-clamp-1">{{ session.title }}</span>
        <div v-if="isAdmin" class="flex gap-0.5 shrink-0">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-square-pen"
            size="xs"
            aria-label="Editar"
            @click="emit('edit', session)"
          />
          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-trash"
            size="xs"
            :loading="deleting"
            aria-label="Eliminar"
            @click="emit('delete', session)"
          />
        </div>
      </div>
      <div class="flex items-center gap-2 text-xs text-muted">
        <UIcon name="i-lucide-clock" class="size-3" />
        {{ session.startTime }} – {{ session.endTime }}
      </div>
      <div v-if="session.location" class="flex items-center gap-2 text-xs text-muted">
        <UIcon name="i-lucide-map-pin" class="size-3" />
        {{ session.location }}
      </div>
    </template>
  </UCard>
</template>
