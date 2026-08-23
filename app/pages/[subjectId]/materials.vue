<script setup lang="ts">
import { computed } from 'vue'
import type { Material, Unit } from '~/types/materials'
import MaterialCard from '~/components/MaterialCard.vue'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)

const [
  { data: materials, status, error, refresh: refreshMaterials },
  { data: units, refresh: refreshUnits }
] = await Promise.all([
  useFetch<Material[]>('/api/materials', { query: { subjectId: subjectId.value } }),
  useFetch<Unit[]>('/api/units', { query: { subjectId: subjectId.value } })
])

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
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-highlighted">Material de Estudio</h2>
        <p class="text-sm text-muted">Guías, presentaciones y recursos organizados por unidad</p>
      </div>
    </div>

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

    <!-- Secciones con títulos y cuadrícula de materiales -->
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
          />
        </div>
      </section>
    </div>
  </div>
</template>