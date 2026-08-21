export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const subjectId = query.subjectId as string

  if (!subjectId) {
    throw createError({ statusCode: 400, statusMessage: 'subjectId es requerido.' })
  }

  const announcements = await prisma.announcement.findMany({
    where: { subjectId },
    orderBy: { createdAt: 'desc' },
    include: {
      options: {
        include: {
          _count: {
            select: { votes: true },
          },
        },
      },
    },
  })

  // Transform to include vote counts without exposing authorizedEmails
  return announcements.map((a) => {
    const options = a.options.map((o) => ({
      id: o.id,
      label: o.label,
      voteCount: o._count.votes,
    }))

    const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0)

    return {
      id: a.id,
      title: a.title,
      content: a.content,
      type: a.type,
      deadline: a.deadline,
      createdAt: a.createdAt,
      subjectId: a.subjectId,
      options,
      totalVotes,
    }
  })
})