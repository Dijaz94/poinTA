<script setup lang="ts">
import type { PollOptionData } from '~/types/announcements'

const props = defineProps<{
  options: PollOptionData[]
  email: string
  voting: boolean
}>()

const selected = defineModel<string>('selected', { required: true })

const emit = defineEmits<{
  submit: []
  reset: []
}>()

const items = computed(() => props.options.map(o => ({ value: o.id, label: o.label })))
</script>

<template>
  <div class="space-y-4 pt-3 border-t border-[var(--atelier-border-muted)]">
    <div class="flex items-center justify-between p-2.5 rounded-[6px] bg-[var(--atelier-surface-muted)]/60 border border-[var(--atelier-border)] text-xs">
      <span class="text-toned">
        Votante verificado: <strong class="font-tech text-highlighted">{{ email }}</strong>
      </span>
      <button
        type="button"
        class="min-h-[32px] px-2 font-tech text-xs font-semibold text-[var(--atelier-cobalt)] hover:underline"
        @click="emit('reset')"
      >
        CAMBIAR
      </button>
    </div>

    <!-- Alerta de voto definitivo con Terracota Editorial moderado -->
    <div class="p-3 rounded-[6px] bg-[var(--atelier-terracotta-soft)] border border-[var(--atelier-terracotta-border)] text-[var(--atelier-terracotta)] text-xs flex items-start gap-2">
      <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0 mt-0.5" />
      <span><strong>Nota de registro:</strong> El voto es definitivo e irreversible una vez confirmado.</span>
    </div>

    <URadioGroup
      v-model="selected"
      :items="items"
      variant="card"
      legend="Selecciona una alternativa:"
      :ui="{ legend: 'block font-tech text-xs font-semibold text-muted uppercase tracking-wider mb-2' }"
    />

    <div class="pt-1 flex items-center justify-end gap-3">
      <UButton
        color="primary"
        icon="i-lucide-check"
        label="Confirmar y emitir voto"
        class="min-h-[44px]"
        :loading="voting"
        :disabled="!selected"
        @click="emit('submit')"
      />
    </div>
  </div>
</template>
