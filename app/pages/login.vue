<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Si ya hay sesión, o cuando se inicie, redirigir al dashboard
watch(user, (currentUser) => {
  if (currentUser) {
    return navigateTo('/admin')
  }
}, { immediate: true })

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  try {
    loading.value = true
    errorMsg.value = ''

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (authError) throw authError

    // La navegación será manejada por el watch sobre `user` una vez que la sesión esté lista
  } catch {
    errorMsg.value = 'Credenciales incorrectas. Revisa tu correo y contraseña.'
    loading.value = false
  }
}
</script>

<template>
  <div class="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 atelier-grid-pattern">
    <div class="w-full max-w-md">
      <TechnicalCard
        index="TA"
        eyebrow="AUTENTICACIÓN DOCENTE"
        code="ACCESO RESTRINGIDO"
        accent="cobalt"
      >
        <div class="text-center flex flex-col items-center pb-5 mb-5 border-b border-[var(--atelier-border-muted)]">
          <div class="mb-3">
            <AppLogo size="lg" :show-text="false" />
          </div>
          <h1 class="font-editorial text-2xl sm:text-3xl font-medium text-highlighted">
            Portal de <span class="italic font-normal text-[var(--atelier-cobalt)]">ayudantes</span>
          </h1>
          <p class="mt-1 text-xs sm:text-sm text-muted">
            Ingresa tus credenciales para gestionar materiales, horarios y votaciones
          </p>
        </div>

        <form class="space-y-5" @submit.prevent="handleLogin">
          <UFormField label="Correo electrónico" name="email">
            <UInput
              v-model="email"
              type="email"
              size="lg"
              icon="i-lucide-mail"
              placeholder="tu@correo.cl"
              required
              class="w-full"
            />
          </UFormField>

          <UFormField label="Contraseña" name="password">
            <div class="flex items-center justify-between w-full mb-1">
              <span class="text-xs text-muted">Credencial de acceso</span>
              <NuxtLink to="/forgot-password" class="font-tech text-xs font-medium text-[var(--atelier-cobalt)] hover:underline">
                ¿Olvidaste tu contraseña?
              </NuxtLink>
            </div>
            <UInput
              v-model="password"
              type="password"
              size="lg"
              icon="i-lucide-lock"
              placeholder="••••••••"
              required
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="errorMsg"
            color="error"
            variant="soft"
            icon="i-lucide-circle-alert"
            :description="errorMsg"
          />

          <UButton
            type="submit"
            color="primary"
            block
            size="lg"
            class="min-h-[44px]"
            :loading="loading"
          >
            Iniciar sesión
          </UButton>
        </form>

        <template #footer>
          <div class="text-center">
            <NuxtLink
              to="/"
              class="inline-flex items-center justify-center gap-1.5 min-h-[40px] font-tech text-xs text-toned hover:text-[var(--atelier-cobalt)] transition-colors"
            >
              <UIcon name="i-lucide-arrow-left" class="size-3.5" />
              <span>VOLVER AL CATÁLOGO DE ESTUDIANTES</span>
            </NuxtLink>
          </div>
        </template>
      </TechnicalCard>
    </div>
  </div>
</template>