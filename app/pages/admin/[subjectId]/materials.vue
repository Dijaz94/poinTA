<script setup lang="ts">
import type { Material } from '~/types/materials'
import ModalDeleteMaterial from '~/components/ModalDeleteMaterial.vue'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)
const toast = useToast()
const supabase = useSupabaseClient()
const overlay = useOverlay()
const confirmDelete = overlay.create(ModalDeleteMaterial)

const { data: materials, status, error, refresh } = await useFetch<Material[]>('/api/materials', {
  query: { subjectId },
})

const mode = ref<'file' | 'url'>('file')
const title = ref('')
const description = ref('')
const fileUrl = ref('')
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const deletingId = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    selectedFile.value = file
    if (!title.value.trim()) {
      // Auto-completar título con el nombre del archivo sin la extensión
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

const submit = async () => {
  if (!title.value.trim()) {
    toast.add({ title: 'Ingresa un título para el material.', color: 'warning' })
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('title', title.value.trim())
    if (description.value.trim()) {
      formData.append('description', description.value.trim())
    }
    formData.append('subjectId', subjectId.value)

    if (mode.value === 'file' && selectedFile.value) {
      formData.append('file', selectedFile.value)
    } else if (mode.value === 'url' && fileUrl.value.trim()) {
      formData.append('fileUrl', fileUrl.value.trim())
    } else {
      toast.add({ title: 'Debes seleccionar un archivo o ingresar una URL.', color: 'warning' })
      uploading.value = false
      return
    }

    await $fetch('/api/admin/materials', {
      method: 'POST',
      body: formData,
    })

    title.value = ''
    description.value = ''
    fileUrl.value = ''
    clearSelectedFile()
    toast.add({ title: 'Material agregado con éxito.', color: 'success' })
    await refresh()
  } catch (e: any) {
    console.error('Error al guardar material:', e)
    toast.add({
      title: e?.data?.statusMessage ?? e?.message ?? 'No se pudo agregar el material.',
      color: 'error',
    })
  } finally {
    uploading.value = false
  }
}

const remove = async (material: Material) => {
  const instance = confirmDelete.open({
    title: 'Eliminar material',
    description: `¿Estás seguro de que deseas eliminar "${material.title}"? Esta acción no se puede deshacer.`,
  })

  if (!(await instance.result)) return

  deletingId.value = material.id
  try {
    await $fetch(`/api/admin/materials/${material.id}`, { method: 'DELETE' })
    toast.add({ title: 'Material eliminado.', color: 'success' })
    await refresh()
  } catch (e: any) {
    toast.add({
      title: e?.data?.statusMessage ?? 'No se pudo eliminar el material.',
      color: 'error',
    })
  } finally {
    deletingId.value = ''
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Subir material -->
    <UCard>
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 class="text-lg font-bold text-highlighted">Agregar material</h2>
          <!-- Selector de Modo: Archivo o URL -->
          <div class="flex items-center gap-2 bg-muted/40 p-1 rounded-lg border border-muted/50">
            <UButton
              size="xs"
              :variant="mode === 'file' ? 'solid' : 'ghost'"
              :color="mode === 'file' ? 'primary' : 'neutral'"
              icon="i-heroicons-paper-clip"
              label="Subir Archivo"
              @click="mode = 'file'"
            />
            <UButton
              size="xs"
              :variant="mode === 'url' ? 'solid' : 'ghost'"
              :color="mode === 'url' ? 'primary' : 'neutral'"
              icon="i-heroicons-link"
              label="Enlace Externo"
              @click="mode = 'url'"
            />
          </div>
        </div>
      </template>

      <form class="space-y-5" @submit.prevent="submit">
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
                <UIcon name="i-heroicons-cloud-arrow-up" class="size-6" />
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
                <UIcon name="i-heroicons-document" class="size-5" />
              </div>
              <div class="truncate">
                <p class="text-sm font-medium text-default truncate">{{ selectedFile.name }}</p>
                <p class="text-xs text-muted">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
            </div>
            <UButton
              color="error"
              variant="ghost"
              icon="i-heroicons-x-mark"
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

        <UFormField label="Título" name="title">
          <UInput v-model="title" placeholder="Ej: Guía de ejercicios N°2" class="w-full" />
        </UFormField>

        <UFormField label="Descripción (opcional)" name="description">
          <UTextarea v-model="description" placeholder="Breve descripción del material..." class="w-full" :rows="2" />
        </UFormField>

        <div class="pt-2">
          <UButton
            type="submit"
            color="primary"
            icon="i-heroicons-arrow-up-tray"
            :label="mode === 'file' ? 'Subir y Guardar' : 'Agregar enlace'"
            :loading="uploading"
          />
        </div>
      </form>
    </UCard>

    <!-- Lista de materiales -->
    <div>
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        title="No se pudieron cargar los materiales."
        class="mb-6"
      >
        <template #description>
          <div class="flex items-center justify-between gap-4">
            <span>Ocurrió un error al consultar la plataforma.</span>
            <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
          </div>
        </template>
      </UAlert>

      <div v-else-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <USkeleton v-for="i in 3" :key="i" class="h-32 w-full rounded-xl" />
      </div>

      <div
        v-else-if="materials?.length === 0"
        class="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-muted"
      >
        <p class="text-muted">No has subido materiales para esta asignatura.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="material in materials"
          :key="material.id"
          :ui="{ root: 'flex flex-col h-full border border-muted', body: 'flex flex-col h-full gap-3' }"
        >
          <div class="flex-1">
            <div class="flex items-start gap-3 mb-2">
              <div class="p-2 rounded-lg bg-secondary/10 text-secondary shrink-0">
                <UIcon name="i-heroicons-document-text" class="size-5" />
              </div>
              <h3 class="font-bold text-default line-clamp-2">{{ material.title }}</h3>
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
              icon="i-heroicons-arrow-top-right-on-square"
              label="Abrir archivo"
              size="sm"
            />
            <UButton
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              :loading="deletingId === material.id"
              aria-label="Eliminar material"
              size="sm"
              @click="remove(material)"
            />
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>