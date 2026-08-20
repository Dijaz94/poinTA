import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de usuario requerido.' })
  }

  assertAdmin(event)

  const admin = serverSupabaseServiceRole(event)
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  await prisma.user.delete({ where: { id } })

  return { ok: true }
})