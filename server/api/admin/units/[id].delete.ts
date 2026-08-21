export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requerido' })
  }

  const unit = await prisma.unit.findUnique({
    where: { id },
  })
  if (!unit) {
    throw createError({ statusCode: 404, statusMessage: 'Unidad no encontrada' })
  }

  await assertTaCanModify(event, unit.subjectId)

  await prisma.unit.delete({
    where: { id },
  })

  return { success: true }
})
