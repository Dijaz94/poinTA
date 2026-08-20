export default defineNuxtRouteMiddleware((_to) => {
  if (import.meta.server) return

  const user = useSupabaseUser()

  if (!user.value) {
    return navigateTo('/login')
  }
})