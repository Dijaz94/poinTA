import { serverSupabaseUser } from '#supabase/server'
import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  // Solo proteger las rutas /api que mutan datos
  if (!event.path.startsWith('/api') || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.method)) {
    return
  }

  // Requiere sesión de Supabase
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autorizado: solo los ayudantes autorizados pueden modificar los datos.',
    })
  }

  // Sincroniza el usuario de Supabase con la tabla User (id = auth uid)
  const email = user.email ?? user.user_metadata?.email
  if (email) {
    const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? email.split('@')[0]
    event.context.pointaUser = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { id: user.sub, name, email },
    })
  }
})