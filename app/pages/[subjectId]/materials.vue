<script setup lang="ts">
import type { Material, Unit } from '~/types/materials'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)

const [
  { data: materials, status, error, refresh },
  { data: units }
] = await Promise.all([
  useFetch<Material[]>('/api/materials', { query: { subjectId } }),
  useFetch<Unit[]>('/api/units', { query: { subjectId } })
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
    const rootUnits = units.value.filter(u => !u.parentId)

    rootUnits.forEach((root) => {
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
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-highlighted">Material de Apoyo</h2>
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
          <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <div v-else-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <USkeleton v-for="i in 3" :key="i" class="h-32 w-full rounded-xl" />
    </div>

    <div v-else-if="materials?.length === 0" class="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-muted">
      <UIcon name="i-lucide-folder-open" class="text-4xl text-muted mb-4" />
      <h3 class="text-lg font-semibold text-highlighted mb-2">No hay materiales</h3>
      <p class="text-muted max-w-sm mx-auto">
        No se han subido materiales para esta asignatura aún.
      </p>
    </div>

    <!-- Secciones organizadas con títulos de sección y cuadrículas -->
    <div v-else class="space-y-12">
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

        <!-- Grilla de materiales de la sección -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UCard
            v-for="material in section.materials"
            :key="material.id"
            :ui="{
              root: 'group flex flex-col h-full border border-muted hover:border-secondary transition-colors',
              body: 'flex flex-col h-full gap-4',
            }"
          >
            <div class="flex-1">
              <div class="flex items-start gap-3 mb-2">
                <div class="p-2 rounded-lg bg-secondary/10 text-secondary mt-0.5">
                  <UIcon name="i-lucide-file-text" class="size-5" />
                </div>
                <div>
                  <h4 class="font-bold text-default line-clamp-2">{{ material.title }}</h4>
                </div>
              </div>
              <p v-if="material.description" class="text-sm text-muted line-clamp-3 ml-12">
                {{ material.description }}
              </p>
            </div>

            <div class="pt-4 mt-auto border-t border-muted/30 flex justify-end">
              <UButton
                :to="material.fileUrl"
                target="_blank"
                color="secondary"
                variant="soft"
                icon="i-lucide-external-link"
                label="Abrir enlace"
                size="sm"
              />
            </div>
          </UCard>
        </div>
      </section>
    </div>
  </div>
</template>