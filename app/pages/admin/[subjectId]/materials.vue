<script setup lang="ts">
import type { Material, Unit } from '~/types/materials'
import ModalDeleteMaterial from '~/components/ModalDeleteMaterial.vue'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)
const toast = useToast()
const overlay = useOverlay()
const confirmDelete = overlay.create(ModalDeleteMaterial)

const creatingUnit = ref(false)
const deletingUnitId = ref('')
const newUnitName = ref('')
const newUnitParentId = ref('none')

const { data: materials, status, error, refresh } = await useFetch<Material[]>('/api/materials', {
  query: { subjectId },
})

const { data: units, refresh: refreshUnits } = await useFetch<Unit[]>('/api/units', {
  query: { subjectId },
})

const handleCreateUnit = async () => {
  if (!newUnitName.value.trim()) return
  
  creatingUnit.value = true
  try {
    await $fetch('/api/admin/units', {
      method: 'POST',
      body: {
        name: newUnitName.value.trim(),
        subjectId: subjectId.value,
        parentId: newUnitParentId.value === 'none' ? null : newUnitParentId.value,
      },
    })
    toast.add({ title: 'Unidad creada con éxito.', color: 'success' })
    newUnitName.value = ''
    newUnitParentId.value = 'none'
    
    // Ejecutar ambos refrescos en paralelo sin bloquear infinitamente
    refresh()
    refreshUnits()
  } catch (e: any) {
    toast.add({
      title: e?.data?.statusMessage ?? e?.message ?? 'Error al crear la unidad.',
      color: 'error',
    })
  } finally {
    creatingUnit.value = false
  }
}

const handleDeleteUnit = async (unit: Unit) => {
  if (!confirm(`¿Eliminar la unidad "${unit.name}"? Los materiales asociados pasarán a "Material General".`)) {
    return
  }

  deletingUnitId.value = unit.id
  try {
    await $fetch(`/api/admin/units/${unit.id}`, {
      method: 'DELETE',
    })
    toast.add({ title: 'Unidad eliminada.', color: 'success' })
    refreshUnits()
    refresh()
  } catch (e: any) {
    toast.add({
      title: e?.data?.statusMessage ?? e?.message ?? 'Error al eliminar la unidad.',
      color: 'error',
    })
  } finally {
    deletingUnitId.value = ''
  }
}

const mode = ref<'file' | 'url'>('file')
const title = ref('')
const description = ref('')
const fileUrl = ref('')
const selectedUnitId = ref('none')
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const deletingId = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const scrollToManageUnits = () => {
  const el = document.getElementById('gestionar-unidades')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const rootUnits = computed(() => {
  return units.value?.filter(u => !u.parentId) || []
})

const parentOptions = computed(() => {
  return [
    { label: 'Ninguna (Unidad principal)', value: 'none' },
    ...rootUnits.value.map(u => ({ label: `Sub-sección de: ${u.name}`, value: u.id })),
  ]
})

const unitOptions = computed(() => {
  const options = [{ label: 'Material General (Sin unidad)', value: 'none' }]
  if (!units.value) return options

  const roots = units.value.filter(u => !u.parentId)

  roots.forEach((root) => {
    options.push({ label: root.name, value: root.id })
    const children = units.value?.filter(u => u.parentId === root.id) || []
    children.forEach((child) => {
      options.push({ label: `↳ ${root.name} / ${child.name}`, value: child.id })
    })
  })

  return options
})

interface SectionGroup {
  id: string
  title: string
  parentTitle?: string
  isSubUnit?: boolean
  materials: Material[]
}

const groupedSections = computed<SectionGroup[]>(() => {
  if (!materials.value) return []

  const sections: SectionGroup[] = []

  // 1. Material General (sin unidad asignada)
  const generalMaterials = materials.value.filter(m => !m.unitId || !m.unit)
  if (generalMaterials.length > 0) {
    sections.push({
      id: 'general',
      title: 'Material General',
      materials: generalMaterials,
    })
  }

  // 2. Unidades jerárquicas
  if (units.value) {
    const roots = units.value.filter(u => !u.parentId)

    roots.forEach((root) => {
      const rootMaterials = materials.value?.filter(m => m.unitId === root.id) || []
      const subUnits = units.value?.filter(u => u.parentId === root.id) || []

      // Si la unidad raíz tiene materiales directamente
      if (rootMaterials.length > 0) {
        sections.push({
          id: root.id,
          title: root.name,
          materials: rootMaterials,
        })
      }

      // Si tiene sub-unidades con materiales
      subUnits.forEach((sub) => {
        const subMaterials = materials.value?.filter(m => m.unitId === sub.id) || []
        if (subMaterials.length > 0) {
          sections.push({
            id: sub.id,
            title: sub.name,
            parentTitle: root.name,
            isSubUnit: true,
            materials: subMaterials,
          })
        }
      })
    })
  }

  // 3. Fallback: Si un material tiene una unidad que no aparece en units
  const existingSectionIds = new Set(sections.map(s => s.id))
  const orphanedMaterials = materials.value.filter(m => m.unitId && !existingSectionIds.has(m.unitId) && m.unit)
  if (orphanedMaterials.length > 0) {
    sections.push({
      id: 'other',
      title: 'Otros Materiales',
      materials: orphanedMaterials,
    })
  }

  return sections
})

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
    if (selectedUnitId.value && selectedUnitId.value !== 'none') {
      formData.append('unitId', selectedUnitId.value)
    }

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
  <div class="space-y-10">
    <!-- Panel Agregar material -->
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
              @click="scrollToManageUnits"
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
            :loading="uploading"
          />
        </div>
      </form>
    </UCard>

    <!-- Lista de materiales organizados por Unidades / Secciones -->
    <div class="space-y-8">
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-lucide-triangle-alert"
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

      <!-- Secciones con títulos y grillas -->
      <div v-else class="space-y-10">
        <section
          v-for="section in groupedSections"
          :key="section.id"
          class="space-y-4"
        >
          <!-- Título de Sección -->
          <div class="flex items-center gap-3 border-b border-muted/40 pb-2.5">
            <div
              class="p-1.5 rounded-lg shrink-0"
              :class="section.isSubUnit ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'"
            >
              <UIcon
                :name="section.id === 'general' ? 'i-lucide-folder' : (section.isSubUnit ? 'i-lucide-corner-down-right' : 'i-lucide-folder-tree')"
                class="size-5"
              />
            </div>
            <div>
              <div v-if="section.parentTitle" class="text-xs text-muted font-medium">
                {{ section.parentTitle }}
              </div>
              <h3 class="text-lg font-bold text-highlighted">
                {{ section.title }}
              </h3>
            </div>
            <span class="text-xs text-muted ml-auto bg-muted/40 px-2 py-0.5 rounded-full">
              {{ section.materials.length }} {{ section.materials.length === 1 ? 'material' : 'materiales' }}
            </span>
          </div>

          <!-- Cuadrícula de materiales para esta sección -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UCard
              v-for="material in section.materials"
              :key="material.id"
              :ui="{ root: 'flex flex-col h-full border border-muted', body: 'flex flex-col h-full gap-3' }"
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
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash"
                  :loading="deletingId === material.id"
                  aria-label="Eliminar material"
                  size="sm"
                  @click="remove(material)"
                />
              </div>
            </UCard>
          </div>
        </section>
      </div>
    </div>

    <!-- Panel Gestionar Unidades (Siempre visible) -->
    <UCard
      id="gestionar-unidades"
      class="border-primary/20 bg-primary/5 shadow-sm scroll-mt-24"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-primary/10 text-primary">
            <UIcon name="i-lucide-folder-tree" class="size-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-highlighted">Gestionar Unidades y Secciones</h3>
            <p class="text-xs text-muted">Organiza el contenido de la asignatura en jerarquías.</p>
          </div>
        </div>
      </template>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Columna 1: Formulario para crear unidad -->
        <div class="space-y-4">
          <h4 class="text-sm font-semibold text-highlighted flex items-center gap-2">
            <UIcon name="i-lucide-folder-plus" class="size-4 text-primary" />
            Nueva Unidad o Sección
          </h4>
          
          <form class="p-4 bg-background border border-muted/50 rounded-xl space-y-4 shadow-sm" @submit.prevent="handleCreateUnit">
            <div class="space-y-4">
              <UFormField label="Nombre">
                <UInput
                  v-model="newUnitName"
                  placeholder="Ej: Unidad 1 o Semana 1"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Jerarquía">
                <USelect
                  v-model="newUnitParentId"
                  :items="parentOptions"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="flex justify-end pt-2">
              <UButton
                type="submit"
                color="primary"
                size="sm"
                icon="i-lucide-plus"
                label="Crear Unidad"
                :loading="creatingUnit"
                :disabled="!newUnitName.trim()"
              />
            </div>
          </form>
        </div>

        <!-- Columna 2: Lista de unidades actuales -->
        <div class="space-y-4 lg:border-l lg:border-muted/30 lg:pl-8">
          <h4 class="text-sm font-semibold text-highlighted">Estructura actual</h4>

          <div
            v-if="!units || units.length === 0"
            class="text-center py-8 text-muted text-sm bg-background border border-dashed border-muted rounded-xl"
          >
            No hay unidades creadas aún. Todo el material estará en "Material General".
          </div>

          <div v-else class="space-y-2.5 max-h-[22rem] overflow-y-auto pr-2 custom-scrollbar">
            <template v-for="root in rootUnits" :key="root.id">
              <!-- Unidad Principal -->
              <div class="flex items-center justify-between p-3 bg-background border border-muted/60 rounded-xl shadow-sm">
                <div class="flex items-center gap-2.5">
                  <UIcon name="i-lucide-folder" class="size-4 text-primary" />
                  <span class="font-semibold text-sm text-default">{{ root.name }}</span>
                </div>
                <UButton
                  type="button"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash"
                  size="xs"
                  :loading="deletingUnitId === root.id"
                  aria-label="Eliminar unidad"
                  @click="handleDeleteUnit(root)"
                />
              </div>

              <!-- Sub-secciones -->
              <div
                v-for="child in units.filter(u => u.parentId === root.id)"
                :key="child.id"
                class="ml-8 flex items-center justify-between p-2.5 bg-background/50 border border-muted/40 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-corner-down-right" class="size-3.5 text-muted" />
                  <UIcon name="i-lucide-file-text" class="size-3.5 text-secondary" />
                  <span class="text-sm text-default">{{ child.name }}</span>
                </div>
                <UButton
                  type="button"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash"
                  size="xs"
                  :loading="deletingUnitId === child.id"
                  aria-label="Eliminar sub-sección"
                  @click="handleDeleteUnit(child)"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-muted);
  border-radius: 20px;
}
</style>