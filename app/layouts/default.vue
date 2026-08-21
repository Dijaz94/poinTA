<template>
  <div class="min-h-screen bg-default">
    <header class="bg-ink-900 border-b border-ink-800 sticky top-0 z-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <NuxtLink to="/">
          <AppLogo subtitle="Plataforma de Ayudantías" />
        </NuxtLink>

        <div class="flex items-center gap-3">
          <UColorModeButton />
          <UButton
            to="/login"
            color="neutral"
            variant="ghost"
            icon="i-heroicons-lock-closed"
            label="TAs"
            size="sm"
          />
        </div>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>
