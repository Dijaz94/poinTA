<script setup lang="ts">
import { computed } from 'vue'
import type { Subject } from '~/types/subjects'

const route = useRoute()
const colorMode = useColorMode()

const subjectId = computed(() => {
  const param = route.params.subjectId
  return typeof param === 'string' && param.length > 0 ? param : null
})

// Lee el payload en caché de la asignatura activa sin disparar peticiones duplicadas
const activeSubject = computed<Subject | null>(() => {
  if (!subjectId.value) return null
  const { data } = useNuxtData<Subject>(`subject-${subjectId.value}`)
  if (data.value) return data.value
  const { data: list } = useNuxtData<Subject[]>('subjects-index')
  return list.value?.find(s => s.id === subjectId.value) ?? null
})

const subjectTabs = computed(() => {
  if (!subjectId.value) return []
  return [
    {
      index: '01',
      label: 'Anuncios',
      icon: 'i-lucide-megaphone',
      to: `/${subjectId.value}`,
      active: route.path === `/${subjectId.value}` || route.path === `/${subjectId.value}/`,
    },
    {
      index: '02',
      label: 'Materiales',
      icon: 'i-lucide-folder-tree',
      to: `/${subjectId.value}/materials`,
      active: route.path.startsWith(`/${subjectId.value}/materials`),
    },
    {
      index: '03',
      label: 'Horario',
      icon: 'i-lucide-calendar-days',
      to: `/${subjectId.value}/schedule`,
      active: route.path.startsWith(`/${subjectId.value}/schedule`),
    },
  ]
})

const isDark = computed(() => colorMode.value === 'dark')

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[var(--atelier-bg)] text-[var(--atelier-text)]">
    <!-- Cabecera Unificada Sticky (Sin backdrop-blur, bordes técnicos de 1px) -->
    <header class="sticky top-0 z-50 bg-[var(--atelier-surface)] border-b border-[var(--atelier-border)]">
      <div class="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div class="min-h-[60px] flex items-center justify-between gap-2 sm:gap-4">
          <!-- Izquierda: Logo + Contexto de Asignatura -->
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <NuxtLink
              v-if="subjectId"
              to="/"
              class="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -ml-1 rounded-[6px] border border-transparent hover:border-[var(--atelier-border)] hover:bg-[var(--atelier-surface-muted)]/60 text-toned hover:text-highlighted transition-colors shrink-0"
              aria-label="Volver al catálogo de asignaturas"
              title="Volver al inicio"
            >
              <UIcon name="i-lucide-arrow-left" class="size-4" />
            </NuxtLink>

            <NuxtLink to="/" class="inline-flex items-center min-h-[44px] shrink-0">
              <AppLogo :subtitle="subjectId ? '' : 'Archivo de Ayudantías'" />
            </NuxtLink>

            <!-- Separador y Código de Asignatura Activa -->
            <template v-if="subjectId">
              <span class="text-[var(--atelier-border-strong)] select-none hidden xs:inline" aria-hidden="true">/</span>
              <div class="flex items-center gap-2 min-w-0">
                <span
                  v-if="activeSubject?.code"
                  class="font-tech text-xs font-semibold px-1.5 py-0.5 rounded-[4px] bg-[var(--atelier-surface-muted)] text-highlighted border border-[var(--atelier-border)] shrink-0"
                >
                  {{ activeSubject.code }}
                </span>
                <span
                  v-if="activeSubject?.name"
                  class="text-sm font-medium text-toned truncate max-w-[140px] sm:max-w-[200px] lg:max-w-[260px] hidden sm:inline"
                >
                  {{ activeSubject.name }}
                </span>
              </div>
            </template>
          </div>

          <!-- Centro (Desktop): Pestañas de Asignatura Integradas en la Misma Barra -->
          <nav
            v-if="subjectId"
            aria-label="Secciones de la asignatura"
            class="hidden md:flex items-center gap-1 self-stretch"
          >
            <NuxtLink
              v-for="tab in subjectTabs"
              :key="tab.to"
              :to="tab.to"
              class="relative inline-flex items-center gap-2 px-3.5 min-h-[44px] text-sm font-medium transition-colors"
              :class="tab.active
                ? 'text-[var(--atelier-cobalt)] font-semibold'
                : 'text-toned hover:text-highlighted'"
            >
              <span class="font-tech text-[11px] opacity-75">{{ tab.index }}</span>
              <UIcon :name="tab.icon" class="size-4 shrink-0" />
              <span>{{ tab.label }}</span>
              <span
                v-if="tab.active"
                class="absolute bottom-0 inset-x-2 h-[2px] bg-[var(--atelier-cobalt)]"
                aria-hidden="true"
              />
            </NuxtLink>
          </nav>

          <!-- Derecha: Toggle Tema + Acceso TAs -->
          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ClientOnly>
              <button
                type="button"
                class="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[6px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)] hover:bg-[var(--atelier-surface-muted)] text-toned hover:text-highlighted transition-colors"
                :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
                :title="isDark ? 'Modo claro' : 'Modo oscuro'"
                @click="toggleColorMode"
              >
                <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-4" />
              </button>
              <template #fallback>
                <div class="min-w-[44px] min-h-[44px]" />
              </template>
            </ClientOnly>

            <NuxtLink
              to="/login"
              class="inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] rounded-[6px] border border-[var(--atelier-border)] bg-[var(--atelier-surface-muted)]/50 hover:bg-[var(--atelier-surface-muted)] hover:border-[var(--atelier-border-strong)] text-xs font-tech font-medium text-highlighted transition-colors"
            >
              <UIcon name="i-lucide-key-round" class="size-3.5 text-[var(--atelier-cobalt)]" />
              <span>ACCESO TA</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Fila Integrada Móvil (< md): Pestañas Táctiles de Asignatura dentro de la misma cabecera -->
        <nav
          v-if="subjectId"
          aria-label="Secciones de la asignatura (móvil)"
          class="grid grid-cols-3 md:hidden border-t border-[var(--atelier-border-muted)] -mx-3 px-2 bg-[var(--atelier-surface)]"
        >
          <NuxtLink
            v-for="tab in subjectTabs"
            :key="tab.to"
            :to="tab.to"
            class="relative inline-flex items-center justify-center gap-1.5 min-h-[44px] px-2 text-xs font-medium transition-colors"
            :class="tab.active
              ? 'text-[var(--atelier-cobalt)] font-semibold bg-[var(--atelier-cobalt-soft)]/35'
              : 'text-toned hover:text-highlighted'"
          >
            <span class="font-tech text-[10px] opacity-75">{{ tab.index }}</span>
            <UIcon :name="tab.icon" class="size-3.5 shrink-0" />
            <span class="truncate">{{ tab.label }}</span>
            <span
              v-if="tab.active"
              class="absolute bottom-0 inset-x-2 h-[2px] bg-[var(--atelier-cobalt)]"
              aria-hidden="true"
            />
          </NuxtLink>
        </nav>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="flex-1 flex flex-col">
      <slot />
    </main>

    <!-- Pie de Página Editorial Técnico -->
    <footer class="border-t border-[var(--atelier-border)] bg-[var(--atelier-surface)] mt-auto">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-tech text-muted text-left">
        <div class="flex items-center gap-2">
          <span class="inline-block size-1.5 rounded-full bg-[var(--atelier-text-muted)]" aria-hidden="true" />
          <span>POINTA // PLATAFORMA DE AYUDANTÍAS UNIVERSITARIAS · EDICIÓN 2026</span>
        </div>
        <p class="text-left sm:text-right">
          &copy; Desarrollado por <span class="text-highlighted font-medium">Diego Álvarez Aravena</span>
        </p>
      </div>
    </footer>
  </div>
</template>
