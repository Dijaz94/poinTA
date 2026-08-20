import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de usuario requerido.' })
  }

  const currentAdmin = assertAdmin(event)
  if (currentAdmin.id === id) {
    throw createError({ statusCode: 400, statusMessage: 'No puedes eliminar tu propia cuenta de administrador.' })
  }

  const admin = serverSupabaseServiceRole(event)
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  await prisma.user.delete({ where: { id } })

  return { ok: true }
})