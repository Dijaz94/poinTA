<template>
  <div class="min-h-screen bg-default transition-colors duration-300">
    <header class="bg-white dark:bg-ink-950 border-b border-muted dark:border-ink-800 sticky top-0 z-50 transition-colors duration-300">
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
    <footer class="bg-white dark:bg-ink-950 border-t border-muted dark:border-ink-800 bottom-0 z-50 transition-colors duration-300">
      <p class="text-ink-500 dark:text-ink-200 text-center pt-6 text-sm transition-colors duration-300">PoinTA 2026  </p>
      <p class="text-ink-500 dark:text-ink-200 text-center pb-6 text-sm transition-colors duration-300">&copy; Desarrollado por Diego Álvarez Aravena</p>
    </footer>
  </div>
</template>
