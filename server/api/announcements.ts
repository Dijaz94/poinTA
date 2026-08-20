import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    const query = getQuery(event)
    const subjectId = query.subjectId as string

    if (!subjectId) {
      throw createError({ statusCode: 400, statusMessage: 'subjectId is required' })
    }

    return await prisma.announcement.findMany({
      where: { subjectId },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (method === 'POST') {
    const body = await readBody(event)
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
      throw createError({ statusCode: 400, statusMessage: 'Announcement ID is required' })
    }

    return await prisma.announcement.delete({
      where: { id },
    })
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})
