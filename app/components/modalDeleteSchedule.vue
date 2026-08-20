<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()

const emit = defineEmits<{
  close: [confirmed: boolean]
}>()
</script>

<template>
  <UModal :close="{ onClick: () => emit('close', false) }" :title="title" :description="description">
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton label="Cancelar" color="neutral" variant="outline" @click="emit('close', false)" />
        <UButton label="Eliminar" color="error" @click="emit('close', true)" />
      </div>
    </template>
  </UModal>
</template>
