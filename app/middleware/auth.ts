export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const user = useSupabaseUser()

  if (!user.value) {
    return navigateTo('/login')
  }

  // Role guard for admin-only pages
  if (to.path.startsWith('/admin/users')) {
    const { data } = await useMe()
    if (data.value?.role !== 'ADMIN') {
      return navigateTo('/admin')
    }
  }
})
