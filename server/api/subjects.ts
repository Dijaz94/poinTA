import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    // List all subjects
    return await prisma.subject.findMany({
      orderBy: { name: 'asc' },
    })
  }

  if (method === 'POST') {
    const body = await readBody(event)
    return await prisma.subject.create({
      data: {
        name: body.name,
        code: body.code,
        semester: body.semester,
      },
    })
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method Not Allowed',
  })
})
