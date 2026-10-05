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
  <div class="space-y-4 pt-2 border-t border-muted/30">
    <div class="space-y-2">
      <label class="block text-xs font-semibold text-muted uppercase tracking-wider">Opciones disponibles:</label>
      <div class="space-y-1.5">
        <div
          v-for="opt in options"
          :key="opt.id"
          class="p-2.5 rounded-lg bg-muted/20 border border-muted/30 text-sm font-medium text-muted flex items-center gap-2"
        >
          <UIcon name="i-lucide-radio" class="size-4 text-muted/60" />
          <span>{{ opt.label }}</span>
        </div>
      </div>
    </div>

    <div class="bg-muted/20 p-4 rounded-xl border border-muted/40 space-y-3">
      <div>
        <label class="block text-sm font-semibold text-highlighted mb-1">Ingresa tu correo institucional para votar</label>
        <p class="text-xs text-muted">Verificaremos que estés en la lista autorizada para habilitar tu voto.</p>
      </div>

      <form class="flex flex-col sm:flex-row gap-2" @submit.prevent="emit('submit')">
        <UInput
          v-model="email"
          placeholder="ej: tu.correo@universidad.cl"
          class="flex-1"
          type="email"
          icon="i-lucide-mail"
        />
        <UButton
          type="submit"
          color="primary"
          variant="solid"
          label="Participar"
          icon="i-lucide-arrow-right"
          :loading="checking"
        />
      </form>

      <p v-if="errorMessage" class="text-xs text-error font-medium">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>
