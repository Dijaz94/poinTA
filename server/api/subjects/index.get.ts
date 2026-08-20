export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // ?mine=true => asignaturas del ayudante autenticado (dashboard admin)
  if (query.mine === 'true') {
    const ta = getTa(event)
    if (!ta) return []

    // Admin sees all subjects
    if (ta.role === 'ADMIN') {
      return await prisma.subject.findMany({ orderBy: { name: 'asc' } })
    }

    // TA sees only assigned subjects
    const user = await prisma.user.findUnique({
      where: { id: ta.id },
      include: { subjects: { orderBy: { name: 'asc' } } },
    })
    return user?.subjects ?? []
  }

  return await prisma.subject.findMany({ orderBy: { name: 'asc' } })
})