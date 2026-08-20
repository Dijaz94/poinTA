<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { data: me } = await useFetch('/api/auth/me')

const isAdmin = computed(() => me.value?.role === 'ADMIN')

const handleLogout = async () => {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-default">
    <header class="bg-ink-900 border-b border-ink-800 sticky top-0 z-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <NuxtLink to="/admin" class="flex items-center gap-2.5 group">
          <span class="size-3 rounded-full bg-secondary inline-block" />
          <span class="font-bold text-lg text-white tracking-tight font-display">PoinTA</span>
          <span class="text-xs text-ink-300 hidden sm:inline">Portal de Ayudantes</span>
        </NuxtLink>

        <div class="flex items-center gap-3">
          <UColorModeButton />
          <UButton
            v-if="isAdmin"
            to="/admin/users"
            color="neutral"
            variant="ghost"
            icon="i-heroicons-users"
            label="Usuarios"
            size="sm"
            class="hidden sm:inline-flex"
          />
          <span v-if="user?.email" class="text-sm text-ink-300 hidden md:inline">{{ user.email }}</span>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-arrow-left-on-rectangle"
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
