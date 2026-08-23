<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Material, Unit } from '~/types/materials'
import ModalDeleteMaterial from '~/components/ModalDeleteMaterial.vue'
import MaterialCard from '~/components/MaterialCard.vue'
import MaterialUploadForm from '~/components/MaterialUploadForm.vue'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)

const toast = useToast()
const overlay = useOverlay()
const confirmDelete = overlay.create(ModalDeleteMaterial)

const uploadFormRef = ref<InstanceType<typeof MaterialUploadForm> | null>(null)
const uploading = ref(false)
const deletingMaterialId = ref('')

const creatingUnit = ref(false)
const deletingUnitId = ref('')
const newUnitName = ref('')
const newUnitParentId = ref('none')

const [
  { data: materials, status, error, refresh: refreshMaterials },
  { data: units, refresh: refreshUnits }
] = await Promise.all([
  useFetch<Material[]>('/api/materials', { query: { subjectId: subjectId.value } }),
  useFetch<Unit[]>('/api/units', { query: { subjectId: subjectId.value } })
])

// ─── Unidades Computed Options ───
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

// ─── Secciones Agrupadas ───
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

  const generalMaterials = materials.value.filter(m => !m.unitId || !m.unit)
  if (generalMaterials.length > 0) {
    sections.push({
      id: 'general',
      title: 'Material General',
      materials: generalMaterials,
    })
  }

  if (units.value) {
    const roots = units.value.filter(u => !u.parentId)

    roots.forEach((root) => {
      const rootMaterials = materials.value?.filter(m => m.unitId === root.id) || []
      const subUnits = units.value?.filter(u => u.parentId === root.id) || []

      if (rootMaterials.length > 0) {
        sections.push({
          id: root.id,
          title: root.name,
          materials: rootMaterials,
        })
      }

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

// ─── Handlers Materiales ───
const handleUploadMaterial = async (data: {
  title: string
  description?: string
  unitId?: string
  file?: File
  fileUrl?: string
}) => {
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    formData.append('subjectId', subjectId.value)
    if (data.unitId) formData.append('unitId', data.unitId)

    if (data.file) {
      formData.append('file', data.file)
    } else if (data.fileUrl) {
      formData.append('fileUrl', data.fileUrl)
    }

    await $fetch('/api/admin/materials', {
      method: 'POST',
      body: formData,
    })

    uploadFormRef.value?.resetForm()
    toast.add({ title: 'Material agregado con éxito.', color: 'success' })
    await refreshMaterials()
  } catch (e: any) {
    toast.add({
      title: e?.data?.statusMessage ?? e?.message ?? 'No se pudo agregar el material.',
      color: 'error',
    })
  } finally {
    uploading.value = false
  }
}

const handleRemoveMaterial = async (material: Material) => {
  const instance = confirmDelete.open({
    title: 'Eliminar material',
    description: `¿Estás seguro de que deseas eliminar "${material.title}"? Esta acción no se puede deshacer.`,
  })

  if (!(await instance.result)) return

  deletingMaterialId.value = material.id
  try {
    await $fetch(`/api/admin/materials/${material.id}`, { method: 'DELETE' })
    toast.add({ title: 'Material eliminado.', color: 'success' })
    await refreshMaterials()
  } catch (e: any) {
    toast.add({
      title: e?.data?.statusMessage ?? 'No se pudo eliminar el material.',
      color: 'error',
    })
  } finally {
    deletingMaterialId.value = ''
  }
}

// ─── Handlers Unidades ───
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

    refreshMaterials()
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
    refreshMaterials()
  } catch (e: any) {
    toast.add({
      title: e?.data?.statusMessage ?? e?.message ?? 'Error al eliminar la unidad.',
      color: 'error',
    })
  } finally {
    deletingUnitId.value = ''
  }
}

const scrollToManageUnits = () => {
  const el = document.getElementById('gestionar-unidades')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="space-y-10">
    <!-- Panel Agregar material -->
    <MaterialUploadForm
      ref="uploadFormRef"
      :unit-options="unitOptions"
      :submitting="uploading"
      @submit="handleUploadMaterial"
      @scroll-to-units="scrollToManageUnits"
    />

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
            <UButton color="neutral" variant="soft" size="sm" @click="() => refreshMaterials()">Reintentar</UButton>
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
        <p class="text-muted">No hay material para esta asignatura aún.</p>
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
            <MaterialCard
              v-for="material in section.materials"
              :key="material.id"
              :material="material"
              :is-admin="true"
              :deleting="deletingMaterialId === material.id"
              @delete="handleRemoveMaterial"
            />
          </div>
        </section>
      </div>
    </div>

    <!-- Panel Gestionar Unidades -->
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

          <div v-else class="space-y-2.5 max-h-88 overflow-y-auto pr-2 custom-scrollbar">
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