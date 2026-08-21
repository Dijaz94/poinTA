export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const subjectId = query.subjectId as string

  if (!subjectId) {
    throw createError({ statusCode: 400, statusMessage: 'subjectId es requerido.' })
  }

  return await prisma.unit.findMany({
    where: { subjectId },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'asc' },
    ],
    include: {
      parent: true,
      children: {
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' },
        ],
      },
    },
  })
})
