export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de anuncio requerido.' })
  }

  const announcement = await prisma.announcement.findUnique({ where: { id } })
  if (!announcement) {
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado.' })
  }

  await assertTaCanModify(event, announcement.subjectId)

  return await prisma.announcement.delete({ where: { id } })
})