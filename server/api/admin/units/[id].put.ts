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

  const body = await readBody(event)
  const name = (body.name as string)?.trim()
  const parentId = body.parentId !== undefined ? ((body.parentId as string)?.trim() || null) : undefined
  const order = typeof body.order === 'number' ? body.order : undefined

  if (parentId && parentId === id) {
    throw createError({ statusCode: 400, statusMessage: 'Una unidad no puede ser su propio padre.' })
  }

  return await prisma.unit.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(order !== undefined ? { order } : {}),
      ...(parentId !== undefined ? { parentId } : {}),
    },
    include: {
      children: true,
      parent: true,
    },
  })
})
