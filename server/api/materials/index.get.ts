export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const subjectId = query.subjectId as string

  if (!subjectId) {
    throw createError({ statusCode: 400, statusMessage: 'subjectId es requerido.' })
  }

  return await prisma.material.findMany({
    where: { subjectId },
    orderBy: { createdAt: 'desc' },
  })
})