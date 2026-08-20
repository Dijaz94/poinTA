import { prisma } from '../utils/prisma'
import { assertTaCanModify } from '../utils/authz'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    const query = getQuery(event)
    const subjectId = query.subjectId as string

    if (!subjectId) {
      throw createError({ statusCode: 400, statusMessage: 'subjectId es requerido.' })
    }

    return await prisma.announcement.findMany({
      where: { subjectId },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (method === 'POST') {
    const body = await readBody(event)

    await assertTaCanModify(event, body.subjectId)

    return await prisma.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        subjectId: body.subjectId,
      },
    })
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = query.id as string

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID de anuncio requerido.' })
    }

    const announcement = await prisma.announcement.findUnique({ where: { id } })
    if (!announcement) {
      throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado.' })
    }

    await assertTaCanModify(event, announcement.subjectId)

    return await prisma.announcement.delete({ where: { id } })
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})