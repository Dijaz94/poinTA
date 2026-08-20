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

    return await prisma.session.findMany({
      where: { subjectId },
      orderBy: [{ isRecurring: 'desc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })
  }

  if (method === 'POST') {
    const body = await readBody(event)

    await assertTaCanModify(event, body.subjectId)

    return await prisma.session.create({
      data: {
        title: body.title,
        isRecurring: body.isRecurring ?? true,
        dayOfWeek: body.dayOfWeek ?? null,
        date: body.date ? new Date(body.date) : null,
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location,
        subjectId: body.subjectId,
      },
    })
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    const id = body.id as string

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID de sesión requerido para actualizar.' })
    }

    const session = await prisma.session.findUnique({ where: { id } })
    if (!session) {
      throw createError({ statusCode: 404, statusMessage: 'Sesión no encontrada.' })
    }

    await assertTaCanModify(event, session.subjectId)

    // Actualización parcial: solo los campos enviados (ideal para drag-and-drop)
    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.isRecurring !== undefined) data.isRecurring = body.isRecurring
    if (body.dayOfWeek !== undefined) data.dayOfWeek = body.dayOfWeek
    if (body.date !== undefined) data.date = body.date ? new Date(body.date) : null
    if (body.startTime !== undefined) data.startTime = body.startTime
    if (body.endTime !== undefined) data.endTime = body.endTime
    if (body.location !== undefined) data.location = body.location

    return await prisma.session.update({ where: { id }, data })
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = query.id as string

    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ID de sesión requerido.' })
    }

    const session = await prisma.session.findUnique({ where: { id } })
    if (!session) {
      throw createError({ statusCode: 404, statusMessage: 'Sesión no encontrada.' })
    }

    await assertTaCanModify(event, session.subjectId)

    return await prisma.session.delete({ where: { id } })
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})