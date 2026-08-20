export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de usuario requerido.' })
  }

  assertAdmin(event)

  const body = await readBody(event)
  const { role, addSubjectIds, removeSubjectIds } = body as {
    role?: 'ADMIN' | 'TA'
    addSubjectIds?: string[]
    removeSubjectIds?: string[]
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado.' })
  }

  const updates: any = {}

  if (role) {
    updates.role = role
  }

  if (addSubjectIds?.length) {
    updates.subjects = { connect: addSubjectIds.map(sid => ({ id: sid })) }
  }

  if (removeSubjectIds?.length) {
    updates.subjects = { ...updates.subjects, disconnect: removeSubjectIds.map(sid => ({ id: sid })) }
  }

  await prisma.user.update({ where: { id }, data: updates })

  const updated = await prisma.user.findUnique({
    where: { id },
    include: { subjects: { select: { id: true, name: true } } },
  })

  return { id: updated!.id, email: updated!.email, name: updated!.name, role: updated!.role, subjects: updated!.subjects }
})