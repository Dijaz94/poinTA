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
            icon="i-lucide-lock"
            label="TAs"
            size="sm"
          />
        </div>
      </div>
    </header>

    <main>
      <slot />
    </main>
    <footer class="bg-ink-900 border-t border-ink-800 bottom-0 z-50">
      <p class="text-ink-200 text-center pt-6 text-sm">PoinTA 2026  </p>
      <p class="text-ink-200 text-center pb-6 text-sm">&copy; Desarrollado por Diego Álvarez Aravena</p>
    </footer>
  </div>
</template>
