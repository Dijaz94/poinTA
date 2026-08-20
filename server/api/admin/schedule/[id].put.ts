export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de sesión requerido para actualizar.' })
  }

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) {
    throw createError({ statusCode: 404, statusMessage: 'Sesión no encontrada.' })
  }

  await assertTaCanModify(event, session.subjectId)

  const body = await readBody(event)

  // Actualización parcial: solo los campos enviados (ideal para drag-and-drop)
  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title
  if (body.isRecurring !== undefined) data.isRecurring = body.isRecurring
  if (body.dayOfWeek !== undefined) data.dayOfWeek = body.dayOfWeek
  if (body.date !== undefined) data.date = body.date ? new Date(body.date) : null
  if (body.startTime !== undefined) data.startTime = body.startTime
  if (body.endTime !== undefined) data.endTime = body.endTime
  if (body.location !== undefined) data.location = body.location

  return await prisma.session.update({ where: { id }, data })
})