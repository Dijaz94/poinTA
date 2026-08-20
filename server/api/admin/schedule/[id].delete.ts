export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de sesión requerido.' })
  }

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) {
    throw createError({ statusCode: 404, statusMessage: 'Sesión no encontrada.' })
  }

  await assertTaCanModify(event, session.subjectId)

  return await prisma.session.delete({ where: { id } })
})