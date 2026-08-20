export default defineEventHandler(async (event) => {
  assertAdmin(event)

  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    include: { subjects: { select: { id: true, name: true, code: true } } },
  })

  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    subjects: u.subjects,
  }))
})