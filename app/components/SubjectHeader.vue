<script setup lang="ts">
import type { Subject } from '~/types/subjects'

defineProps<{
  subjectId: string
  subject?: Subject | null
  status: 'pending' | 'success' | 'error' | 'idle'
  isAdmin?: boolean
}>()
</script>

<template>
  <!-- En vista pública renderiza el Bento Context Header con tarjetas-ficha -->
  <BentoContextHeader
    v-if="!isAdmin"
    :subject-id="subjectId"
    :subject="subject"
    :status="status"
  />

  <!-- En vista Admin renderiza una franja técnica compacta (las pestañas ya viven en la barra superior unificada) -->
  <div
    v-else
    class="border-b border-[var(--atelier-border)] bg-[var(--atelier-surface-muted)]/40"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="atelier-tag px-2 py-0.5 rounded-[4px] bg-[var(--atelier-surface)] border border-[var(--atelier-border)] text-muted">
          MODO EDICIÓN TA
        </span>
        <h1 v-if="subject" class="font-editorial text-xl font-medium text-highlighted truncate">
          {{ subject.name }}
        </h1>
        <USkeleton v-else-if="status === 'pending'" class="h-6 w-48" />
      </div>

      <UButton
        v-if="subject"
        :to="`/${subject.id}`"
        color="secondary"
        variant="soft"
        size="xs"
        icon="i-lucide-external-link"
        label="Abrir ficha pública"
        class="lg:hidden"
      />
    </div>
  </div>
</template>
