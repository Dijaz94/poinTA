<script setup lang="ts">
definePageMeta({ layout: 'default' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

// Redirigir al login si se accede directamente sin estar logueado (por token de recuperación)
watch(user, (currentUser) => {
  if (!currentUser) {
    return navigateTo('/login')
  }
}, { immediate: true })

const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleUpdatePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = 'Las contraseñas no coinciden.'
    return
  }

  if (newPassword.value.length < 6) {
    errorMsg.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }

  try {
    loading.value = true
    errorMsg.value = ''

    const { error } = await supabase.auth.updateUser({
      password: newPassword.value
    })

    if (error) throw error

    toast.add({
      title: 'Contraseña actualizada',
      description: 'Tu contraseña se ha actualizado correctamente.',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
    
    // Redirect to admin portal
    return navigateTo('/admin')
  } catch (e: any) {
    errorMsg.value = e.message || 'Error al actualizar la contraseña.'
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
            <h2 class="text-2xl font-bold tracking-tight text-highlighted font-display">Actualizar Contraseña</h2>
            <p class="mt-1 text-sm text-muted">Ingresa tu nueva contraseña para acceder a tu cuenta</p>
          </div>
        </template>

        <form class="space-y-6" @submit.prevent="handleUpdatePassword">
          <UFormField label="Nueva contraseña" name="newPassword">
            <UInput
              v-model="newPassword"
              type="password"
              icon="i-lucide-lock"
              placeholder="••••••••"
              required
              class="w-full"
            />
          </UFormField>

          <UFormField label="Confirmar contraseña" name="confirmPassword">
            <UInput
              v-model="confirmPassword"
              type="password"
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
            :loading="loading"
          >
            Actualizar contraseña
          </UButton>
        </form>
      </UCard>
    </div>
  </div>
</template>
