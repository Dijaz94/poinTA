<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { Subject } from '~/types/subjects'
import { usePinnedSubjects } from '~/composables/usePinnedSubjects'

const { data: subjects, status, error, refresh } = await useFetch<Subject[]>('/api/subjects', {
  key: 'subjects-index',
  getCachedData: (key, nuxtApp) => {
    return nuxtApp.payload.data[key]
  },
})

const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

const { pinnedIds, isPinned, togglePin } = usePinnedSubjects()

const pinnedSubjects = computed<Subject[]>(() => {
  if (!subjects.value || pinnedIds.value.length === 0) return []
  return subjects.value.filter(s => pinnedIds.value.includes(s.id))
})

const filteredSubjects = computed<Subject[]>(() => {
  if (!subjects.value) return []
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return subjects.value

  return subjects.value.filter(subject =>
    subject.name.toLowerCase().includes(q)
    || subject.code?.toLowerCase().includes(q)
    || subject.semester?.toLowerCase().includes(q)
    || subject.users?.some(u => u.name.toLowerCase().includes(q))
  )
})

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
    searchInputRef.value?.select()
  } else if (e.key === 'Escape' && document.activeElement === searchInputRef.value) {
    if (searchQuery.value) {
      searchQuery.value = ''
    } else {
      searchInputRef.value?.blur()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

function formatIndex(idx: number): string {
  return String(idx + 1).padStart(2, '0')
}
</script>

<template>
  <div class="flex-1 flex flex-col">
    <!-- Hero Editorial con Grilla Arquitectónica Expuesta de 1px -->
    <section class="relative border-b border-[var(--atelier-border)] bg-[var(--atelier-surface)] atelier-grid-pattern">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div class="max-w-3xl mx-auto text-center">
          <!-- Etiqueta Superior Tipo Ficha Técnica -->
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] border border-[var(--atelier-border)] bg-[var(--atelier-bg)] mb-5">
            <span class="size-1.5 rounded-full bg-[var(--atelier-cobalt)]" aria-hidden="true" />
            <span class="atelier-tag text-toned">
              CATÁLOGO DOCENTE // ÍNDICE DE AYUDANTÍAS
            </span>
          </div>

          <!-- Titular en Newsreader con Acento en Itálica -->
          <h1 class="font-editorial text-4xl sm:text-5xl lg:text-[3.5rem] font-medium tracking-tight text-highlighted leading-[1.08]">
            Archivo y coordinación de <span class="italic font-normal text-[var(--atelier-cobalt)]">ayudantías</span> informáticas
          </h1>

          <p class="mt-4 text-base sm:text-lg text-toned max-w-2xl mx-auto leading-relaxed">
            Consulta guías de estudio por unidad, horarios semanales, salas y votaciones activas de tus asignaturas con acceso directo.
          </p>

          <!-- Campo de Búsqueda Central (Atajo ⌘K / Ctrl+K) -->
          <div class="mt-8 max-w-2xl mx-auto">
            <label for="subject-catalog-search" class="sr-only">
              Buscar por nombre, código o ayudante de asignatura
            </label>
            <div
              class="relative flex items-center rounded-[8px] border border-[var(--atelier-border-strong)] bg-[var(--atelier-bg)] shadow-[var(--atelier-shadow-rest)] focus-within:border-[var(--atelier-cobalt)] focus-within:shadow-[var(--atelier-shadow-cobalt)] transition-all duration-150"
            >
              <span class="pl-3.5 pr-2 text-muted flex items-center pointer-events-none" aria-hidden="true">
                <UIcon name="i-lucide-search" class="size-4" />
              </span>

              <input
                id="subject-catalog-search"
                ref="searchInputRef"
                v-model="searchQuery"
                type="search"
                autocomplete="off"
                placeholder="Buscar por asignatura, sigla (ej. INF) o ayudante..."
                class="w-full min-h-[48px] py-2.5 pr-2 bg-transparent text-sm sm:text-base text-highlighted placeholder:text-muted focus:outline-none"
              >

              <div class="flex items-center gap-1.5 pr-2.5 shrink-0">
                <button
                  v-if="searchQuery !== ''"
                  type="button"
                  class="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -my-1 rounded-[6px] text-muted hover:text-highlighted hover:bg-[var(--atelier-surface-muted)] transition-colors"
                  aria-label="Limpiar búsqueda"
                  @click="searchQuery = ''; searchInputRef?.focus()"
                >
                  <UIcon name="i-lucide-x" class="size-4" />
                </button>

                <kbd
                  class="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-[4px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)] font-tech text-[11px] font-medium text-muted select-none"
                  title="Atajo de teclado: Ctrl+K o ⌘K"
                >
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contenido Principal del Catálogo -->
    <section class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      <!-- Banda de Asignaturas Fijadas (Píldoras Técnicas) -->
      <div
        v-if="pinnedSubjects.length > 0"
        class="p-4 sm:p-5 rounded-[8px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)]"
      >
        <div class="flex items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-pin" class="size-3.5 text-[var(--atelier-cobalt)]" />
            <h2 class="atelier-tag text-highlighted">
              ASIGNATURAS FIJADAS ({{ String(pinnedSubjects.length).padStart(2, '0') }})
            </h2>
          </div>
          <span class="font-tech text-[11px] text-muted hidden sm:inline">
            ACCESO RÁPIDO GUARDADO EN ESTE DISPOSITIVO
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <SubjectPill
            v-for="pinned in pinnedSubjects"
            :key="`pill-${pinned.id}`"
            :subject="pinned"
            @unpin="togglePin"
          />
        </div>
      </div>

      <!-- Cabecera de Índice de Asignaturas -->
      <div>
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-[var(--atelier-border)]">
          <div>
            <span class="atelier-tag text-muted block mb-1">
              ÍNDICE GENERAL // ARCHIVO DE CURSOS
            </span>
            <h2 class="font-editorial text-2xl sm:text-3xl font-medium text-highlighted">
              {{ searchQuery ? 'Resultados de búsqueda' : 'Asignaturas disponibles' }}
            </h2>
          </div>

          <div v-if="subjects" class="font-tech text-xs text-muted">
            MOSTRANDO {{ String(filteredSubjects.length).padStart(2, '0') }} DE {{ String(subjects.length).padStart(2, '0') }} REGISTROS
          </div>
        </div>

        <!-- Estado de Carga -->
        <div v-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
          <USkeleton v-for="i in 6" :key="i" class="h-44 w-full rounded-[8px]" />
        </div>

        <!-- Estado de Error -->
        <UAlert
          v-else-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-triangle-alert"
          title="No se pudieron cargar las asignaturas."
          class="mt-6 max-w-2xl mx-auto"
        >
          <template #description>
            <div class="flex items-center justify-between gap-4">
              <span>Ocurrió un error al consultar el catálogo.</span>
              <UButton color="neutral" variant="soft" size="sm" @click="() => refresh()">Reintentar</UButton>
            </div>
          </template>
        </UAlert>

        <!-- Catálogo Vacío -->
        <div
          v-else-if="subjects?.length === 0"
          class="mt-6 text-center py-14 px-4 rounded-[8px] border border-dashed border-[var(--atelier-border-strong)] bg-[var(--atelier-surface)]/50"
        >
          <UIcon name="i-lucide-book-open" class="size-8 text-muted mb-3 mx-auto" />
          <p class="font-editorial text-xl text-highlighted mb-1">Sin asignaturas registradas</p>
          <p class="text-sm text-muted">Aún no se han publicado asignaturas para este semestre.</p>
        </div>

        <!-- Sin Coincidencias de Búsqueda -->
        <div
          v-else-if="filteredSubjects.length === 0"
          class="mt-6 text-center py-14 px-4 rounded-[8px] border border-dashed border-[var(--atelier-border-strong)] bg-[var(--atelier-surface)]/50"
        >
          <UIcon name="i-lucide-search-x" class="size-8 text-muted mb-3 mx-auto" />
          <p class="font-editorial text-xl text-highlighted mb-1">
            Sin coincidencias para «{{ searchQuery }}»
          </p>
          <p class="text-sm text-muted mb-4">
            Verifica el código de la asignatura o prueba con otro término.
          </p>
          <UButton color="neutral" variant="soft" @click="searchQuery = ''">
            Restablecer catálogo
          </UButton>
        </div>

        <!-- Grilla de Fichas de Archivo Técnico -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-6">
          <TechnicalCard
            v-for="(subject, idx) in filteredSubjects"
            :key="subject.id"
            :index="formatIndex(idx)"
            :eyebrow="`SEM ${subject.semester}`"
            :accent="isPinned(subject.id) ? 'cobalt' : 'none'"
            interactive
            :padded="false"
          >
            <template #meta>
              <div class="flex items-center gap-1.5">
                <span
                  v-if="subject.code"
                  class="font-tech text-xs font-semibold px-1.5 py-0.5 rounded-[4px] bg-[var(--atelier-surface)] border border-[var(--atelier-border)] text-highlighted"
                >
                  {{ subject.code }}
                </span>

                <button
                  type="button"
                  class="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -my-2 -mr-2 rounded-[6px] transition-colors"
                  :class="isPinned(subject.id)
                    ? 'text-[var(--atelier-cobalt)] bg-[var(--atelier-cobalt-soft)]/70'
                    : 'text-muted hover:text-highlighted hover:bg-[var(--atelier-surface)]'"
                  :aria-label="isPinned(subject.id) ? `Desfijar ${subject.name}` : `Fijar ${subject.name}`"
                  :title="isPinned(subject.id) ? 'Asignatura fijada' : 'Fijar asignatura'"
                  @click.stop.prevent="togglePin(subject.id)"
                >
                  <UIcon :name="isPinned(subject.id) ? 'i-lucide-pin-off' : 'i-lucide-pin'" class="size-3.5" />
                </button>
              </div>
            </template>

            <NuxtLink
              :to="`/${subject.id}`"
              class="flex-1 flex flex-col justify-between p-4 sm:p-5 group focus:outline-none"
            >
              <div>
                <h3 class="font-editorial text-xl sm:text-[1.35rem] font-medium text-highlighted group-hover:text-[var(--atelier-cobalt)] transition-colors leading-snug">
                  {{ subject.name }}
                </h3>

                <!-- Ayudantes en monoespaciado -->
                <div class="mt-3 flex items-start gap-2 text-xs font-tech text-muted">
                  <UIcon name="i-lucide-users" class="size-3.5 shrink-0 mt-0.5 text-[var(--atelier-lichen)]" />
                  <span v-if="subject.users?.length" class="line-clamp-2">
                    {{ subject.users.map(u => u.name).join(' · ') }}
                  </span>
                  <span v-else class="italic">
                    Equipo docente por asignar
                  </span>
                </div>
              </div>

              <!-- Pie de métricas técnicas de la asignatura -->
              <div class="mt-5 pt-3 border-t border-[var(--atelier-border-muted)] flex items-center justify-between gap-2 text-xs font-tech">
                <div v-if="subject._count" class="flex items-center gap-3 text-muted">
                  <span title="Anuncios y votaciones">
                    <strong class="text-toned">{{ subject._count.announcements }}</strong> AVISOS
                  </span>
                  <span class="text-[var(--atelier-border-strong)]">·</span>
                  <span title="Materiales de estudio">
                    <strong class="text-toned">{{ subject._count.materials }}</strong> MAT
                  </span>
                  <span class="text-[var(--atelier-border-strong)]">·</span>
                  <span title="Bloques de horario">
                    <strong class="text-toned">{{ subject._count.sessions }}</strong> HOR
                  </span>
                </div>
                <span v-else class="text-muted">ABRIR FICHA</span>

                <span class="inline-flex items-center gap-1 font-semibold text-[var(--atelier-cobalt)] group-hover:translate-x-0.5 transition-transform duration-150">
                  <span>ENTRAR</span>
                  <UIcon name="i-lucide-arrow-right" class="size-3.5" />
                </span>
              </div>
            </NuxtLink>
          </TechnicalCard>
        </div>
      </div>
    </section>
  </div>
</template>
