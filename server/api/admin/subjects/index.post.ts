export default defineEventHandler(async (event) => {
  const ta = assertTa(event)
  if (ta.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Solo los administradores pueden crear asignaturas.' })
  }

  const body = await readBody(event)
  const userIds: string[] = body.userIds ?? []

  return await prisma.subject.create({
    data: {
      name: body.name,
      code: body.code,
      semester: body.semester,
      users: userIds.length > 0
        ? { connect: userIds.map((id: string) => ({ id })) }
        : undefined,
    },
  })
})