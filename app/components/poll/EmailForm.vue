<script setup lang="ts">
import type { PollOptionData } from '~/types/announcements'

defineProps<{
  options: PollOptionData[]
  checking: boolean
  errorMessage: string
}>()

const email = defineModel<string>('email', { required: true })

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <div class="space-y-4 pt-3 border-t border-[var(--atelier-border-muted)]">
    <div class="space-y-2">
      <label class="block atelier-tag text-muted">Alternativas en consulta:</label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div
          v-for="(opt, idx) in options"
          :key="opt.id"
          class="p-2.5 rounded-[6px] bg-[var(--atelier-surface-muted)]/40 border border-[var(--atelier-border)] text-sm text-toned flex items-center gap-2"
        >
          <span class="font-tech text-xs font-semibold text-muted">
            {{ String.fromCharCode(65 + idx) }}.
          </span>
          <span class="font-medium">{{ opt.label }}</span>
        </div>
      </div>
    </div>

    <div class="p-4 rounded-[8px] bg-[var(--atelier-surface-muted)]/45 border border-[var(--atelier-border)] space-y-3">
      <div>
        <label class="block text-sm font-semibold text-highlighted mb-0.5">
          Verificación de correo institucional
        </label>
        <p class="text-xs text-muted">
          Ingresa tu correo universitario para comprobar tu habilitación en el padrón del curso.
        </p>
      </div>

      <form class="flex flex-col sm:flex-row gap-2" @submit.prevent="emit('submit')">
        <UInput
          v-model="email"
          placeholder="ej: nombre.apellido@universidad.cl"
          class="flex-1"
          size="lg"
          type="email"
          icon="i-lucide-mail"
        />
        <UButton
          type="submit"
          color="primary"
          variant="solid"
          label="Verificar padrón"
          icon="i-lucide-arrow-right"
          class="min-h-[44px] justify-center"
          :loading="checking"
        />
      </form>

      <p v-if="errorMessage" class="text-xs text-[var(--atelier-terracotta)] font-medium">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>
