<script setup lang="ts">
import type { Me } from '~/types/users'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { data: me } = await useMe()

const isAdmin = computed(() => me.value?.role === 'ADMIN')

const handleLogout = async () => {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-default transition-colors duration-300">
    <header class="bg-white dark:bg-ink-950 border-b border-muted dark:border-ink-800 sticky top-0 z-50 transition-colors duration-300">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <NuxtLink to="/admin">
          <AppLogo subtitle="Portal de Ayudantes" />
        </NuxtLink>

        <div class="flex items-center gap-3">
          <UColorModeButton />
          <UButton
            v-if="isAdmin"
            to="/admin/users"
            color="neutral"
            variant="ghost"
            icon="i-lucide-users"
            label="Usuarios"
            size="sm"
            class="hidden sm:inline-flex"
          />
          <span v-if="user?.email" class="text-sm text-ink-600 dark:text-ink-300 hidden md:inline transition-colors duration-300">{{ user.email }}</span>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left-on-rectangle"
            label="Cerrar sesión"
            size="sm"
            @click="handleLogout"
          />
        </div>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>
