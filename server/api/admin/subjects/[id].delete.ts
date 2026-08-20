export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de asignatura requerido.' })
  }

  const ta = assertTa(event)

  // Admin can delete any subject
  if (ta.role !== 'ADMIN') {
    const subject = await prisma.subject.findFirst({
      where: { id, users: { some: { id: ta.id } } },
    })
    if (!subject) {
      throw createError({ statusCode: 403, statusMessage: 'No tienes permisos para eliminar esta asignatura.' })
    }
  }

  return await prisma.subject.delete({ where: { id } })
})