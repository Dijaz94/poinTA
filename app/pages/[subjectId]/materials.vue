<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import type { Material, Unit } from '~/types/materials'
import MaterialCard from '~/components/MaterialCard.vue'

const route = useRoute()
const subjectId = computed(() => route.params.subjectId as string)

const [
  { data: materials, status, error, refresh: refreshMaterials },
  { data: units }
] = await Promise.all([
  useFetch<Material[]>(() => `/api/materials?subjectId=${subjectId.value}`, {
    key: () => `materials-${subjectId.value}`,
  }),
  useFetch<Unit[]>(() => `/api/units?subjectId=${subjectId.value}`, {
    key: () => `units-${subjectId.value}`,
  }),
])

const searchQuery = ref('')
const activeSectionId = ref<string>('')
const mobileTreeOpen = ref(false)

interface SectionGroup {
  id: string
  code: string
  title: string
  parentTitle?: string
  isSubUnit?: boolean
  materials: Material[]
}

const groupedSections = computed<SectionGroup[]>(() => {
  if (!materials.value) return []

  const q = searchQuery.value.trim().toLowerCase()
  const matchesFilter = (m: Material) => {
    if (!q) return true
    return (
      m.title.toLowerCase().includes(q)
      || (m.description && m.description.toLowerCase().includes(q))
    )
  }

  const sections: SectionGroup[] = []
  let rootCounter = 0

  const generalMaterials = materials.value.filter(m => (!m.unitId || !m.unit) && matchesFilter(m))
  if (generalMaterials.length > 0) {
    rootCounter++
    sections.push({
      id: 'general',
      code: String(rootCounter).padStart(2, '0'),
      title: 'Material General',
      materials: generalMaterials,
    })
  }

  if (units.value) {
    const roots = units.value.filter(u => !u.parentId)

    roots.forEach((root) => {
      const rootMaterials = (materials.value?.filter(m => m.unitId === root.id) || []).filter(matchesFilter)
      const subUnits = units.value?.filter(u => u.parentId === root.id) || []
      const hasSubMaterials = subUnits.some(
        sub => (materials.value?.filter(m => m.unitId === sub.id) || []).some(matchesFilter)
      )

      if (rootMaterials.length > 0 || hasSubMaterials) {
        rootCounter++
      }
      const currentRootCode = String(rootCounter).padStart(2, '0')

      if (rootMaterials.length > 0) {
        sections.push({
          id: root.id,
          code: currentRootCode,
          title: root.name,
          materials: rootMaterials,
        })
      }

      let subCounter = 0
      subUnits.forEach((sub) => {
        const subMaterials = (materials.value?.filter(m => m.unitId === sub.id) || []).filter(matchesFilter)
        if (subMaterials.length > 0) {
          subCounter++
          sections.push({
            id: sub.id,
            code: `${currentRootCode}.${subCounter}`,
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
  const orphanedMaterials = materials.value.filter(
    m => m.unitId && !existingSectionIds.has(m.unitId) && m.unit && matchesFilter(m)
  )
  if (orphanedMaterials.length > 0) {
    rootCounter++
    sections.push({
      id: 'other',
      code: String(rootCounter).padStart(2, '0'),
      title: 'Otros Materiales',
      materials: orphanedMaterials,
    })
  }

  return sections
})

const currentActiveSection = computed(() => {
  return (
    groupedSections.value.find(s => s.id === activeSectionId.value)
    ?? groupedSections.value[0]
    ?? null
  )
})

function scrollToSection(sectionId: string) {
  activeSectionId.value = sectionId
  mobileTreeOpen.value = false
  if (typeof document === 'undefined') return
  const el = document.getElementById(`unit-section-${sectionId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

let observer: IntersectionObserver | null = null

function setupIntersectionObserver() {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return
  observer?.disconnect()

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible.length > 0) {
        const id = visible[0]!.target.getAttribute('data-section-id')
        if (id) activeSectionId.value = id
      }
    },
    {
      rootMargin: '-120px 0px -65% 0px',
      threshold: 0.05,
    }
  )

  groupedSections.value.forEach((sec) => {
    const el = document.getElementById(`unit-section-${sec.id}`)
    if (el) observer?.observe(el)
  })
}

watch(
  groupedSections,
  async (newSections) => {
    if (newSections.length > 0 && !activeSectionId.value) {
      activeSectionId.value = newSections[0]!.id
    }
    await nextTick()
    setupIntersectionObserver()
  },
  { immediate: true }
)

onMounted(() => {
  setupIntersectionObserver()
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

function formatCardIndex(sectionCode: string, idx: number): string {
  return `${sectionCode}-${String(idx + 1).padStart(2, '0')}`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Cabecera de Sección + Filtro Rápido de Recursos -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--atelier-border)]">
      <div>
        <span class="atelier-tag text-muted block mb-1">
          SECCIÓN 02 // REPOSITORIO POR UNIDADES
        </span>
        <h2 class="font-editorial text-2xl sm:text-3xl font-medium text-highlighted">
          Material de <span class="italic font-normal text-[var(--atelier-cobalt)]">estudio</span>
        </h2>
      </div>

      <!-- Buscador Local de Materiales -->
      <div v-if="materials && materials.length > 0" class="w-full sm:w-72">
        <label for="material-filter-input" class="sr-only">Filtrar materiales por título o descripción</label>
        <div class="relative flex items-center rounded-[6px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)] focus-within:border-[var(--atelier-cobalt)] focus-within:ring-2 focus-within:ring-[var(--atelier-cobalt)]/20 transition-all">
          <UIcon name="i-lucide-search" class="size-4 text-muted ml-3 shrink-0 pointer-events-none" />
          <input
            id="material-filter-input"
            v-model="searchQuery"
            type="text"
            role="searchbox"
            inputmode="search"
            autocomplete="off"
            spellcheck="false"
            placeholder="Filtrar guías o recursos..."
            class="w-full min-w-0 min-h-[42px] px-2.5 bg-transparent border-0 text-xs sm:text-sm text-highlighted placeholder:text-muted focus:outline-none focus:ring-0"
          >
          <button
            v-if="searchQuery"
            type="button"
            class="inline-flex items-center justify-center size-8 mr-1 rounded-[4px] text-muted hover:text-highlighted hover:bg-[var(--atelier-surface-muted)]"
            aria-label="Limpiar filtro"
            @mousedown.prevent
            @click="searchQuery = ''"
          >
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Error -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="No se pudieron cargar los materiales."
    >
      <template #description>
        <div class="flex items-center justify-between gap-4">
          <span>Ocurrió un error al consultar el archivo de la asignatura.</span>
          <UButton color="neutral" variant="soft" size="sm" @click="() => refreshMaterials()">Reintentar</UButton>
        </div>
      </template>
    </UAlert>

    <!-- Cargando -->
    <div v-else-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <USkeleton v-for="i in 3" :key="i" class="h-36 w-full rounded-[8px]" />
    </div>

    <!-- Vacío -->
    <div
      v-else-if="materials?.length === 0"
      class="text-center py-14 px-4 rounded-[8px] border border-dashed border-[var(--atelier-border-strong)] bg-[var(--atelier-surface)]/50"
    >
      <UIcon name="i-lucide-folder-open" class="size-8 text-muted mb-3 mx-auto" />
      <h3 class="font-editorial text-xl text-highlighted mb-1">Repositorio vacío</h3>
      <p class="text-sm text-muted">Aún no se han cargado guías o materiales para esta asignatura.</p>
    </div>

    <div
      v-else-if="groupedSections.length === 0"
      class="text-center py-12 px-4 rounded-[8px] border border-dashed border-[var(--atelier-border-strong)] bg-[var(--atelier-surface)]/50"
    >
      <p class="text-sm text-muted">No se encontraron materiales que coincidan con «{{ searchQuery }}».</p>
    </div>

    <!-- Estructura Principal: Selector Móvil + Barra Lateral Index Spine + Secciones -->
    <div v-else class="lg:grid lg:grid-cols-[250px_1fr] lg:gap-8 items-start">
      <!-- Selector Superior Colapsable en Móvil (< lg) -->
      <div class="lg:hidden mb-6">
        <button
          type="button"
          class="w-full min-h-[46px] px-3.5 py-2.5 rounded-[8px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)] shadow-[var(--atelier-shadow-rest)] flex items-center justify-between gap-2 text-left"
          :aria-expanded="mobileTreeOpen"
          aria-controls="mobile-unit-tree"
          @click="mobileTreeOpen = !mobileTreeOpen"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-tech text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-[var(--atelier-cobalt-soft)] text-[var(--atelier-cobalt)]">
              {{ currentActiveSection?.code ?? '01' }}
            </span>
            <span class="text-xs font-tech text-muted uppercase shrink-0">UNIDAD:</span>
            <span class="text-sm font-medium text-highlighted truncate">
              {{ currentActiveSection?.title ?? 'Seleccionar unidad' }}
            </span>
          </div>
          <UIcon
            :name="mobileTreeOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="size-4 text-muted shrink-0"
          />
        </button>

        <!-- Árbol Desplegable en Móvil -->
        <nav
          v-if="mobileTreeOpen"
          id="mobile-unit-tree"
          aria-label="Índice de unidades (móvil)"
          class="mt-2 p-2.5 rounded-[8px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)] space-y-1"
        >
          <button
            v-for="sec in groupedSections"
            :key="`mob-nav-${sec.id}`"
            type="button"
            class="w-full min-h-[44px] px-3 py-2 rounded-[6px] flex items-center justify-between gap-2 text-left text-xs transition-colors"
            :class="[
              sec.isSubUnit ? 'pl-7' : '',
              activeSectionId === sec.id
                ? 'bg-[var(--atelier-cobalt-soft)] text-[var(--atelier-cobalt)] font-semibold'
                : 'text-toned hover:bg-[var(--atelier-surface-muted)]/60',
            ]"
            @click="scrollToSection(sec.id)"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-tech text-[11px] opacity-80 shrink-0">{{ sec.code }}</span>
              <span class="truncate">{{ sec.title }}</span>
            </div>
            <span class="font-tech text-[11px] text-muted shrink-0">
              {{ sec.materials.length }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Barra Lateral Izquierda (Desktop): Árbol de Unidades Index Spine -->
      <aside
        aria-label="Árbol de unidades"
        class="hidden lg:block sticky top-24 p-4 rounded-[8px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)]"
      >
        <div class="flex items-center justify-between pb-2.5 mb-3 border-b border-[var(--atelier-border-muted)]">
          <span class="atelier-tag text-muted">ÍNDICE DE UNIDADES</span>
          <span class="font-tech text-[11px] text-muted">{{ groupedSections.length }} SEC</span>
        </div>

        <nav class="relative pl-3 border-l border-[var(--atelier-border-strong)] space-y-1">
          <button
            v-for="sec in groupedSections"
            :key="`desk-nav-${sec.id}`"
            type="button"
            class="relative w-full min-h-[40px] px-2.5 py-1.5 rounded-[6px] flex items-center justify-between gap-2 text-left text-xs transition-colors group"
            :class="[
              sec.isSubUnit ? 'pl-5' : '',
              activeSectionId === sec.id
                ? 'bg-[var(--atelier-cobalt-soft)] text-[var(--atelier-cobalt)] font-semibold'
                : 'text-toned hover:text-highlighted hover:bg-[var(--atelier-surface-muted)]/50',
            ]"
            @click="scrollToSection(sec.id)"
          >
            <!-- Indicador de rama activa sobre el Index Spine -->
            <span
              class="absolute -left-[13px] top-1/2 -translate-y-1/2 w-2.5 h-[1px] transition-colors"
              :class="activeSectionId === sec.id ? 'bg-[var(--atelier-cobalt)] h-[2px]' : 'bg-[var(--atelier-border-strong)]'"
              aria-hidden="true"
            />

            <div class="flex items-center gap-2 min-w-0">
              <span class="font-tech text-[11px] opacity-80 shrink-0">{{ sec.code }}</span>
              <span class="truncate">{{ sec.title }}</span>
            </div>

            <span
              class="font-tech text-[10px] px-1.5 py-0.5 rounded-[4px] border shrink-0"
              :class="activeSectionId === sec.id
                ? 'border-[var(--atelier-cobalt-border)] bg-[var(--atelier-surface)] text-[var(--atelier-cobalt)]'
                : 'border-[var(--atelier-border-muted)] bg-[var(--atelier-surface-muted)]/50 text-muted'"
            >
              {{ sec.materials.length }}
            </span>
          </button>
        </nav>
      </aside>

      <!-- Columna Principal: Secciones Numeradas y Fichas de Material -->
      <div class="space-y-10 min-w-0">
        <section
          v-for="section in groupedSections"
          :id="`unit-section-${section.id}`"
          :key="section.id"
          :data-section-id="section.id"
          class="scroll-mt-28 space-y-4"
        >
          <!-- Encabezado de Unidad con Numeración Index Spine -->
          <div class="flex items-end justify-between gap-3 pb-2.5 border-b border-[var(--atelier-border)]">
            <div class="flex items-center gap-3 min-w-0">
              <span
                class="inline-flex items-center justify-center px-2 py-1 rounded-[5px] font-tech text-xs font-semibold border shrink-0"
                :class="section.isSubUnit
                  ? 'bg-[var(--atelier-lichen-soft)] border-[var(--atelier-lichen-border)] text-[var(--atelier-lichen)]'
                  : 'bg-[var(--atelier-cobalt-soft)] border-[var(--atelier-cobalt-border)] text-[var(--atelier-cobalt)]'"
              >
                {{ section.code }}
              </span>

              <div class="min-w-0">
                <div v-if="section.parentTitle" class="font-tech text-[11px] text-muted uppercase truncate">
                  {{ section.parentTitle }} / SUB-UNIDAD
                </div>
                <h3 class="font-editorial text-xl sm:text-2xl font-medium text-highlighted truncate">
                  {{ section.title }}
                </h3>
              </div>
            </div>

            <span class="font-tech text-xs text-muted shrink-0">
              {{ String(section.materials.length).padStart(2, '0') }} {{ section.materials.length === 1 ? 'ARCHIVO' : 'ARCHIVOS' }}
            </span>
          </div>

          <!-- Grilla de Materiales -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MaterialCard
              v-for="(material, mIdx) in section.materials"
              :key="material.id"
              :material="material"
              :index="formatCardIndex(section.code, mIdx)"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>