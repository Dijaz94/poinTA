import { serverSupabaseUser } from '#supabase/server'
import { prisma } from '../utils/prisma'
import { getTa } from '../utils/authz'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    const query = getQuery(event)

    // ?mine=true => asignaturas del ayudante autenticado (dashboard admin)
    if (query.mine === 'true') {
      const user = await serverSupabaseUser(event)
      if (!user) return []

      const email = user.email ?? user.user_metadata?.email
      if (!email) return []

      const ta = await prisma.user.findUnique({
        where: { email },
        include: { subjects: { orderBy: { name: 'asc' } } },
      })

      return ta?.subjects ?? []
    }

    return await prisma.subject.findMany({
      orderBy: { name: 'asc' },
    })
  }

  if (method === 'POST') {
    const ta = getTa(event)
    if (!ta) {
      throw createError({ statusCode: 401, statusMessage: 'No autorizado: debes iniciar sesión.' })
    }

    const body = await readBody(event)

    return await prisma.subject.create({
      data: {
        name: body.name,
        code: body.code,
        semester: body.semester,
        users: { connect: [{ id: ta.id }] },
      },
    })
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = query.id as string
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID de asignatura requerido.' })
    }

    const subject = await prisma.subject.findFirst({
      where: { id, users: { some: { id: getTa(event)?.id ?? '' } } },
    })
    if (!subject) {
      throw createError({ statusCode: 403, statusMessage: 'No tienes permisos para administrar esta asignatura.' })
    }

    return await prisma.subject.delete({ where: { id } })
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method Not Allowed',
  })
})