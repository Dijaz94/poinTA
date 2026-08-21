import { serverSupabaseServiceRole } from '#supabase/server'
import { deleteAuthUserSafely } from '~~/server/utils/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de usuario requerido.' })
  }

  const currentAdmin = assertAdmin(event)
  if (currentAdmin.id === id) {
    throw createError({ statusCode: 400, statusMessage: 'No puedes eliminar tu propia cuenta de administrador.' })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado.' })
  }

  const admin = serverSupabaseServiceRole(event)
  try {
    await deleteAuthUserSafely(admin, id, user.email)
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message || 'Error al eliminar usuario en Auth.' })
  }

  await prisma.user.delete({ where: { id } })

  return { ok: true }
})