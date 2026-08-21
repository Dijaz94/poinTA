<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Si ya hay sesión, redirigir al dashboard
if (user.value) {
  await navigateTo('/admin')
}

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

    await navigateTo('/admin')
  } catch (e: any) {
    errorMsg.value = 'Credenciales incorrectas. Revisa tu correo y contraseña.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
      <UCard>
        <template #header>
          <div class="text-center flex flex-col items-center">
            <div class="mb-3">
              <AppLogo size="lg" :show-text="false" />
            </div>
            <h2 class="text-2xl font-bold tracking-tight text-highlighted font-display">Portal de Ayudantes</h2>
            <p class="mt-1 text-sm text-muted">Ingresa tus credenciales para administrar la plataforma</p>
          </div>
        </template>

        <form class="space-y-6" @submit.prevent="handleLogin">
          <UFormField label="Correo electrónico" name="email">
            <UInput
              v-model="email"
              type="email"
              icon="i-heroicons-envelope"
              placeholder="tu@correo.cl"
              required
              class="w-full"
            />
          </UFormField>

          <UFormField label="Contraseña" name="password">
            <UInput
              v-model="password"
              type="password"
              icon="i-heroicons-lock-closed"
              placeholder="••••••••"
              required
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="errorMsg"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-circle"
            :description="errorMsg"
          />

          <UButton
            type="submit"
            color="primary"
            block
            :loading="loading"
          >
            Iniciar Sesión
          </UButton>
        </form>

        <template #footer>
          <div class="text-center">
            <UButton to="/" variant="link" color="neutral" size="sm" icon="i-heroicons-arrow-left">
              Volver a la vista de estudiantes
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>