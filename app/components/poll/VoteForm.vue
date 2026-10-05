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
  <div class="space-y-4 pt-2 border-t border-muted/30">
    <div class="flex items-center justify-between bg-muted/30 p-2.5 rounded-lg border border-muted/40 text-xs">
      <span class="text-muted">Votando como: <strong class="text-highlighted">{{ email }}</strong></span>
      <button type="button" class="text-primary hover:underline font-medium" @click="emit('reset')">Cambiar</button>
    </div>

    <div class="bg-warning/10 border border-warning/30 text-warning p-3 rounded-xl text-xs flex items-start gap-2">
      <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0 mt-0.5" />
      <span><strong>Atención:</strong> Tu voto es definitivo e irreversible. Una vez enviado no podrás cambiar tu elección.</span>
    </div>

    <URadioGroup
      v-model="selected"
      :items="items"
      variant="card"
      legend="Selecciona tu opción:"
      :ui="{ legend: 'block text-xs font-semibold text-muted uppercase tracking-wider mb-2' }"
    />

    <div class="pt-2 flex items-center justify-end gap-3">
      <UButton
        color="primary"
        icon="i-lucide-check"
        label="Confirmar y Emitir Voto"
        :loading="voting"
        :disabled="!selected"
        @click="emit('submit')"
      />
    </div>
  </div>
</template>
