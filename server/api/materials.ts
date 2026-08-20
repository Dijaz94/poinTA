import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    const query = getQuery(event)
    const subjectId = query.subjectId as string

    if (!subjectId) {
      throw createError({ statusCode: 400, statusMessage: 'subjectId is required' })
    }

    return await prisma.material.findMany({
      where: { subjectId },
      orderBy: { createdAt: 'desc' },
    })
  }

  if (method === 'POST') {
    const body = await readBody(event)
    return await prisma.material.create({
      data: {
        title: body.title,
        description: body.description,
        fileUrl: body.fileUrl,
        subjectId: body.subjectId,
      },
    })
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = query.id as string
    
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Material ID is required' })
    }

    return await prisma.material.delete({
      where: { id },
    })
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})
