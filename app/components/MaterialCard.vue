<script setup lang="ts">
import { computed } from 'vue'
import type { Material } from '~/types/materials'

const props = defineProps<{
  material: Material
  index?: number | string
  isAdmin?: boolean
  deleting?: boolean
}>()

const emit = defineEmits<{
  delete: [material: Material]
}>()

const resourceMeta = computed(() => {
  const url = (props.material.fileUrl || '').toLowerCase()
  if (url.includes('.pdf')) {
    return { label: 'DOC // PDF', icon: 'i-lucide-file-text', tag: 'PDF' }
  }
  if (url.match(/\.(py|ipynb|js|ts|c|cpp|java|rs|go|sql|sh)($|\?)/) || url.includes('github.com') || url.includes('colab.research')) {
    return { label: 'SRC // CÓDIGO', icon: 'i-lucide-file-code', tag: 'CÓDIGO' }
  }
  if (url.match(/\.(ppt|pptx|key)($|\?)/)) {
    return { label: 'SLD // PRESENTACIÓN', icon: 'i-lucide-presentation', tag: 'SLIDES' }
  }
  if (url.match(/\.(zip|rar|7z|tar|gz)($|\?)/)) {
    return { label: 'PKG // COMPRIMIDO', icon: 'i-lucide-file-archive', tag: 'ZIP' }
  }
  if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.match(/\.(mp4|mkv|webm)($|\?)/)) {
    return { label: 'VID // CÁPSULA', icon: 'i-lucide-film', tag: 'VIDEO' }
  }
  return { label: 'REF // RECURSO', icon: 'i-lucide-link-2', tag: 'ENLACE' }
})
</script>

<template>
  <TechnicalCard
    :index="index"
    :eyebrow="resourceMeta.label"
    interactive
  >
    <template #meta>
      <span class="font-tech text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-[var(--atelier-surface)] text-toned border border-[var(--atelier-border)]">
        {{ resourceMeta.tag }}
      </span>
    </template>

    <div class="flex-1 flex flex-col justify-between gap-4">
      <div>
        <div class="flex items-start gap-2.5">
          <UIcon
            :name="resourceMeta.icon"
            class="size-4 text-muted shrink-0 mt-1"
          />
          <h4 class="font-editorial text-lg font-medium text-highlighted leading-snug line-clamp-2">
            {{ material.title }}
          </h4>
        </div>

        <p
          v-if="material.description"
          class="text-xs sm:text-sm text-toned line-clamp-3 mt-2 leading-relaxed"
        >
          {{ material.description }}
        </p>
      </div>

      <div class="pt-3 border-t border-[var(--atelier-border-muted)] flex items-center justify-between gap-2">
        <a
          :href="material.fileUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 min-h-[44px] px-3 -my-1.5 -ml-1 rounded-[6px] font-tech text-xs font-semibold text-[var(--atelier-cobalt)] hover:bg-[var(--atelier-cobalt-soft)]/60 transition-colors"
        >
          <span>ABRIR RECURSO</span>
          <UIcon name="i-lucide-arrow-up-right" class="size-3.5" />
        </a>

        <UButton
          v-if="isAdmin"
          color="error"
          variant="ghost"
          icon="i-lucide-trash"
          class="min-w-[44px] min-h-[44px] justify-center"
          :loading="deleting"
          aria-label="Eliminar material"
          size="sm"
          @click="emit('delete', material)"
        />
      </div>
    </div>
  </TechnicalCard>
</template>
