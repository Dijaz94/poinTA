export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, name: true } },
      _count: { select: { materials: true, announcements: true, sessions: true } },
    },
  })

  if (!subject) {
    throw createError({ statusCode: 404, statusMessage: 'Asignatura no encontrada.' })
  }

  return subject
})