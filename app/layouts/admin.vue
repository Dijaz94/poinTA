<script setup lang="ts">
import { computed } from 'vue'
import type { Subject } from '~/types/subjects'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const colorMode = useColorMode()
const { data: me } = await useMe()

const isAdmin = computed(() => me.value?.role === 'ADMIN')

const subjectId = computed(() => {
  const param = route.params.subjectId
  return typeof param === 'string' && param.length > 0 ? param : null
})

const activeSubject = computed<Subject | null>(() => {
  if (!subjectId.value) return null
  const { data } = useNuxtData<Subject>(`subject-${subjectId.value}`)
  return data.value ?? null
})

const adminSubjectTabs = computed(() => {
  if (!subjectId.value) return []
  return [
    {
      index: '01',
      label: 'Anuncios',
      icon: 'i-lucide-megaphone',
      to: `/admin/${subjectId.value}/announcements`,
      active: route.path.startsWith(`/admin/${subjectId.value}/announcements`),
    },
    {
      index: '02',
      label: 'Materiales',
      icon: 'i-lucide-folder-tree',
      to: `/admin/${subjectId.value}/materials`,
      active: route.path.startsWith(`/admin/${subjectId.value}/materials`),
    },
    {
      index: '03',
      label: 'Horario',
      icon: 'i-lucide-calendar-days',
      to: `/admin/${subjectId.value}/schedule`,
      active: route.path.startsWith(`/admin/${subjectId.value}/schedule`),
    },
  ]
})

const isDark = computed(() => colorMode.value === 'dark')
const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[var(--atelier-bg)] text-[var(--atelier-text)]">
    <!-- Cabecera Unificada Admin -->
    <header class="sticky top-0 z-50 bg-[var(--atelier-surface)] border-b border-[var(--atelier-border)]">
      <div class="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div class="min-h-[60px] flex items-center justify-between gap-2 sm:gap-4">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <NuxtLink
              v-if="subjectId"
              to="/admin"
              class="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -ml-1 rounded-[6px] border border-transparent hover:border-[var(--atelier-border)] hover:bg-[var(--atelier-surface-muted)]/60 text-toned hover:text-highlighted transition-colors shrink-0"
              aria-label="Volver al panel de asignaturas"
              title="Volver al panel"
            >
              <UIcon name="i-lucide-arrow-left" class="size-4" />
            </NuxtLink>

            <NuxtLink to="/admin" class="inline-flex items-center min-h-[44px] shrink-0">
              <AppLogo :subtitle="subjectId ? '' : 'Portal de Ayudantes'" />
            </NuxtLink>

            <template v-if="subjectId">
              <span class="text-[var(--atelier-border-strong)] select-none hidden xs:inline" aria-hidden="true">/</span>
              <div class="flex items-center gap-2 min-w-0">
                <span
                  v-if="activeSubject?.code"
                  class="font-tech text-xs font-semibold px-1.5 py-0.5 rounded-[4px] bg-[var(--atelier-cobalt-soft)] text-[var(--atelier-cobalt)] border border-[var(--atelier-cobalt-border)] shrink-0"
                >
                  {{ activeSubject.code }}
                </span>
                <span
                  v-if="activeSubject?.name"
                  class="text-sm font-medium text-highlighted truncate max-w-[140px] sm:max-w-[200px] hidden sm:inline"
                >
                  {{ activeSubject.name }}
                </span>
              </div>
            </template>
          </div>

          <!-- Pestañas de Asignatura en Admin (Desktop) -->
          <nav
            v-if="subjectId"
            aria-label="Gestión de asignatura"
            class="hidden md:flex items-center gap-1 self-stretch"
          >
            <NuxtLink
              v-for="tab in adminSubjectTabs"
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

          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <UButton
              v-if="subjectId"
              :to="`/${subjectId}`"
              color="secondary"
              variant="soft"
              size="sm"
              icon="i-lucide-eye"
              label="Vista pública"
              class="hidden lg:inline-flex min-h-[38px]"
            />

            <ClientOnly>
              <button
                type="button"
                class="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-[6px] border border-[var(--atelier-border)] bg-[var(--atelier-surface)] hover:bg-[var(--atelier-surface-muted)] text-toned hover:text-highlighted transition-colors"
                :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
                @click="toggleColorMode"
              >
                <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-4" />
              </button>
              <template #fallback>
                <div class="min-w-[44px] min-h-[44px]" />
              </template>
            </ClientOnly>

            <UButton
              v-if="isAdmin"
              to="/admin/users"
              color="neutral"
              variant="ghost"
              icon="i-lucide-users"
              label="Usuarios"
              size="sm"
              class="inline-flex min-h-[44px]"
            />

            <span v-if="user?.email" class="font-tech text-xs text-muted hidden xl:inline px-1">
              {{ user.email }}
            </span>

            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-log-out"
              label="Salir"
              size="sm"
              class="min-h-[44px]"
              @click="handleLogout"
            />
          </div>
        </div>

        <!-- Fila Móvil Admin (< md) -->
        <nav
          v-if="subjectId"
          aria-label="Gestión de asignatura (móvil)"
          class="grid grid-cols-3 md:hidden border-t border-[var(--atelier-border-muted)] -mx-3 px-2 bg-[var(--atelier-surface)]"
        >
          <NuxtLink
            v-for="tab in adminSubjectTabs"
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

    <main class="flex-1 flex flex-col">
      <slot />
    </main>
  </div>
</template>
