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
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const handleReset = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    successMsg.value = ''

    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) throw error

    successMsg.value = 'Revisa tu bandeja de entrada. Te hemos enviado un enlace para recuperar tu contraseña.'
  } catch (e: any) {
    errorMsg.value = e.message || 'Ocurrió un error al solicitar el restablecimiento.'
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
            <h2 class="text-2xl font-bold tracking-tight text-highlighted font-display">Recuperar Contraseña</h2>
            <p class="mt-1 text-sm text-muted">Ingresa tu correo para recibir un enlace de recuperación</p>
          </div>
        </template>

        <form v-if="!successMsg" class="space-y-6" @submit.prevent="handleReset">
          <UFormField label="Correo electrónico" name="email">
            <UInput
              v-model="email"
              type="email"
              icon="i-lucide-mail"
              placeholder="tu@correo.cl"
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
            :loading="loading"
          >
            Enviar enlace
          </UButton>
        </form>

        <div v-else class="space-y-6 text-center">
          <UIcon name="i-lucide-mail-check" class="text-5xl text-success mx-auto" />
          <UAlert
            color="success"
            variant="soft"
            :description="successMsg"
          />
        </div>

        <template #footer>
          <div class="text-center">
            <UButton to="/login" variant="link" color="neutral" size="sm" icon="i-lucide-arrow-left">
              Volver al inicio de sesión
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>
