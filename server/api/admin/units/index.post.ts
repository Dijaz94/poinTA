export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = (body.name as string)?.trim()
  const subjectId = (body.subjectId as string)?.trim()
  const parentId = (body.parentId as string)?.trim() || null
  const order = typeof body.order === 'number' ? body.order : 0

  if (!subjectId) {
    throw createError({ statusCode: 400, statusMessage: 'subjectId es requerido.' })
  }
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'El nombre de la unidad es requerido.' })
  }

  await assertTaCanModify(event, subjectId)

  if (parentId) {
    const parentUnit = await prisma.unit.findUnique({
      where: { id: parentId },
    })
    if (!parentUnit || parentUnit.subjectId !== subjectId) {
      throw createError({ statusCode: 400, statusMessage: 'La unidad padre no es válida.' })
    }
  }

  return await prisma.unit.create({
    data: {
      name,
      subjectId,
      parentId,
      order,
    },
    include: {
      children: true,
      parent: true,
    },
  })
})
