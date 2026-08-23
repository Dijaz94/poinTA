<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  unitOptions: { label: string; value: string }[]
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [data: {
    title: string
    description?: string
    unitId?: string
    file?: File
    fileUrl?: string
  }]
  scrollToUnits: []
}>()

const toast = useToast()

const mode = ref<'file' | 'url'>('file')
const title = ref('')
const description = ref('')
const fileUrl = ref('')
const selectedUnitId = ref('none')
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    selectedFile.value = file
    if (!title.value.trim()) {
      title.value = file.name.replace(/\.[^/.]+$/, '')
    }
  }
}

const clearSelectedFile = () => {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleSubmit = () => {
  if (!title.value.trim()) {
    toast.add({ title: 'Ingresa un título para el material.', color: 'warning' })
    return
  }

  if (mode.value === 'file' && !selectedFile.value) {
    toast.add({ title: 'Debes seleccionar un archivo.', color: 'warning' })
    return
  }

  if (mode.value === 'url' && !fileUrl.value.trim()) {
    toast.add({ title: 'Debes ingresar una URL válida.', color: 'warning' })
    return
  }

  emit('submit', {
    title: title.value.trim(),
    description: description.value.trim() || undefined,
    unitId: selectedUnitId.value !== 'none' ? selectedUnitId.value : undefined,
    file: mode.value === 'file' && selectedFile.value ? selectedFile.value : undefined,
    fileUrl: mode.value === 'url' && fileUrl.value.trim() ? fileUrl.value.trim() : undefined,
  })
}

const resetForm = () => {
  title.value = ''
  description.value = ''
  fileUrl.value = ''
  selectedUnitId.value = 'none'
  clearSelectedFile()
}

defineExpose({
  resetForm,
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 class="text-lg font-bold text-highlighted">Agregar material</h2>
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            size="xs"
            variant="outline"
            color="neutral"
            icon="i-lucide-folder-cog"
            label="Ir a Unidades"
            @click="emit('scrollToUnits')"
          />
          <!-- Selector de Modo: Archivo o URL -->
          <div class="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-muted/50">
            <UButton
              size="xs"
              :variant="mode === 'file' ? 'solid' : 'ghost'"
              :color="mode === 'file' ? 'primary' : 'neutral'"
              icon="i-lucide-paper-clip"
              label="Subir Archivo"
              @click="mode = 'file'"
            />
            <UButton
              size="xs"
              :variant="mode === 'url' ? 'solid' : 'ghost'"
              :color="mode === 'url' ? 'primary' : 'neutral'"
              icon="i-lucide-link"
              label="Enlace Externo"
              @click="mode = 'url'"
            />
          </div>
        </div>
      </div>
    </template>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <!-- Subida directa de archivo -->
      <div v-if="mode === 'file'" class="space-y-3">
        <label class="block text-sm font-medium text-highlighted">Archivo del material</label>
        <input
          ref="fileInputRef"
          type="file"
          class="hidden"
          @change="onFileChange"
        />

        <div
          v-if="!selectedFile"
          class="border-2 border-dashed border-muted hover:border-primary/60 transition-colors rounded-xl p-6 text-center cursor-pointer bg-muted/10"
          @click="fileInputRef?.click()"
        >
          <div class="flex flex-col items-center gap-2">
            <div class="p-3 rounded-full bg-primary/10 text-primary">
              <UIcon name="i-lucide-cloud-arrow-up" class="size-6" />
            </div>
            <p class="text-sm font-semibold text-default">
              Haz clic para seleccionar o subir un archivo
            </p>
            <p class="text-xs text-muted">
              PDF, Word, Excel, ZIP, Imágenes, etc.
            </p>
          </div>
        </div>

        <div
          v-else
          class="flex items-center justify-between p-3.5 bg-muted/30 border border-muted rounded-xl"
        >
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <UIcon name="i-lucide-document" class="size-5" />
            </div>
            <div class="truncate">
              <p class="text-sm font-medium text-default truncate">{{ selectedFile.name }}</p>
              <p class="text-xs text-muted">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
          </div>
          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-x"
            size="xs"
            @click="clearSelectedFile"
          />
        </div>
      </div>

      <!-- Enlace URL externo -->
      <UFormField v-else label="Enlace del archivo" name="fileUrl">
        <UInput
          v-model="fileUrl"
          type="url"
          placeholder="https://drive.google.com/... o https://dropbox.com/..."
          class="w-full"
        />
      </UFormField>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UFormField label="Título" name="title">
          <UInput v-model="title" placeholder="Ej: Guía de ejercicios N°2" class="w-full" />
        </UFormField>

        <UFormField label="Unidad / Sección" name="unitId">
          <USelectMenu
            v-model="selectedUnitId"
            :items="unitOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField label="Descripción (opcional)" name="description">
        <UTextarea v-model="description" placeholder="Breve descripción del material..." class="w-full" :rows="2" />
      </UFormField>

      <div class="pt-2">
        <UButton
          type="submit"
          color="primary"
          icon="i-lucide-arrow-up-tray"
          :label="mode === 'file' ? 'Subir y Guardar' : 'Agregar enlace'"
          :loading="submitting"
        />
      </div>
    </form>
  </UCard>
</template>
