<script setup lang="ts">
import type { Material } from '~/types/materials'

defineProps<{
  material: Material
  isAdmin?: boolean
  deleting?: boolean
}>()

const emit = defineEmits<{
  delete: [material: Material]
}>()
</script>

<template>
  <UCard
    :ui="{
      root: 'flex flex-col h-full border border-muted hover:border-secondary transition-colors',
      body: 'flex flex-col h-full gap-3',
    }"
  >
    <div class="flex-1">
      <div class="flex items-start gap-3 mb-2">
        <div class="p-2 rounded-lg bg-secondary/10 text-secondary shrink-0">
          <UIcon name="i-lucide-file-text" class="size-5" />
        </div>
        <h4 class="font-bold text-default line-clamp-2">{{ material.title }}</h4>
      </div>
      <p v-if="material.description" class="text-sm text-muted line-clamp-3 ml-11">
        {{ material.description }}
      </p>
    </div>

    <div class="pt-3 mt-auto border-t border-muted/30 flex items-center justify-between gap-2">
      <UButton
        :to="material.fileUrl"
        target="_blank"
        color="secondary"
        variant="soft"
        icon="i-lucide-external-link"
        label="Abrir archivo"
        size="sm"
      />
      <UButton
        v-if="isAdmin"
        color="error"
        variant="ghost"
        icon="i-lucide-trash"
        :loading="deleting"
        aria-label="Eliminar material"
        size="sm"
        @click="emit('delete', material)"
      />
    </div>
  </UCard>
</template>
