export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de material requerido.' })
  }

  const material = await prisma.material.findUnique({ where: { id } })
  if (!material) {
    throw createError({ statusCode: 404, statusMessage: 'Material no encontrado.' })
  }

  await assertTaCanModify(event, material.subjectId)

  return await prisma.material.delete({ where: { id } })
})