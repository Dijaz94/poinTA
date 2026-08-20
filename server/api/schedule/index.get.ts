export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const subjectId = query.subjectId as string

  if (!subjectId) {
    throw createError({ statusCode: 400, statusMessage: 'subjectId es requerido.' })
  }

  return await prisma.session.findMany({
    where: { subjectId },
    orderBy: [{ isRecurring: 'desc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })
})