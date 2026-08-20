import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    const query = getQuery(event)
    const subjectId = query.subjectId as string

    if (!subjectId) {
      throw createError({ statusCode: 400, statusMessage: 'subjectId is required' })
    }

    return await prisma.session.findMany({
      where: { subjectId },
    })
  }

  if (method === 'POST') {
    const body = await readBody(event)
    return await prisma.session.create({
      data: {
        title: body.title,
        isRecurring: body.isRecurring ?? true,
        dayOfWeek: body.dayOfWeek,
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
      throw createError({ statusCode: 400, statusMessage: 'Session ID is required for updating' })
    }

    return await prisma.session.update({
      where: { id },
      data: {
        title: body.title,
        isRecurring: body.isRecurring,
        dayOfWeek: body.dayOfWeek,
        date: body.date ? new Date(body.date) : null,
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location,
      },
    })
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = query.id as string
    
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Session ID is required' })
    }

    return await prisma.session.delete({
      where: { id },
    })
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})
