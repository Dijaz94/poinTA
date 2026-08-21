export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de anuncio requerido.' })
  }

  const body = await readBody(event)
  const email = (body.email as string)?.trim().toLowerCase()
  const optionId = body.optionId as string

  if (!email || !optionId) {
    throw createError({ statusCode: 400, statusMessage: 'email y optionId son requeridos.' })
  }

  // Fetch announcement with options
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      options: {
        include: {
          votes: { where: { email }, select: { id: true } },
        },
      },
    },
  })

  if (!announcement) {
    throw createError({ statusCode: 404, statusMessage: 'Anuncio no encontrado.' })
  }

  if (announcement.type !== 'POLL') {
    throw createError({ statusCode: 400, statusMessage: 'Este anuncio no es una votación.' })
  }

  // Check deadline
  if (announcement.deadline && new Date() > new Date(announcement.deadline)) {
    throw createError({ statusCode: 400, statusMessage: 'La votación ha expirado.' })
  }

  // Check email is authorized
  if (!announcement.authorizedEmails.includes(email)) {
    throw createError({ statusCode: 403, statusMessage: 'No estás autorizado para votar en esta encuesta.' })
  }

  // Check if already voted on any option of this poll
  const hasVoted = announcement.options.some((o) => o.votes.length > 0)
  if (hasVoted) {
    throw createError({ statusCode: 409, statusMessage: 'Ya has votado en esta encuesta. Tu voto es definitivo.' })
  }

  // Validate that the option belongs to this announcement
  const validOption = announcement.options.find((o) => o.id === optionId)
  if (!validOption) {
    throw createError({ statusCode: 400, statusMessage: 'La opción seleccionada no pertenece a esta encuesta.' })
  }

  // Create the vote
  return await prisma.vote.create({
    data: {
      email,
      optionId,
    },
  })
})
