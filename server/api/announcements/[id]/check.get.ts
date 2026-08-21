export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de anuncio requerido.' })
  }

  const query = getQuery(event)
  const email = (query.email as string)?.trim().toLowerCase()

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'El email es requerido.' })
  }

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      options: {
        select: {
          id: true,
          votes: {
            where: { email },
            select: { id: true, optionId: true },
          },
        },
      },
    },
  })

  if (!announcement) {
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado.' })
  }

  if (announcement.type !== 'POLL') {
    throw createError({ statusCode: 400, statusMessage: 'El anuncio no es una votación.' })
  }

  const isExpired = announcement.deadline ? new Date() > new Date(announcement.deadline) : false
  const authorized = announcement.authorizedEmails.includes(email)

  let hasVoted = false
  let votedOptionId: string | null = null

  for (const opt of announcement.options) {
    if (opt.votes.length > 0) {
      hasVoted = true
      votedOptionId = opt.id
      break
    }
  }

  return {
    authorized,
    hasVoted,
    votedOptionId,
    isExpired,
  }
})
