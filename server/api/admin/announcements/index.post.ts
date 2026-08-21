export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await assertTaCanModify(event, body.subjectId)

  const type = body.type ?? 'COMMUNICATION'

  if (type === 'POLL') {
    const options = body.options as string[]
    const authorizedEmails = body.authorizedEmails as string[]

    if (!options || options.length < 2) {
      throw createError({ statusCode: 400, statusMessage: 'Una votación necesita al menos 2 opciones.' })
    }
    if (!authorizedEmails || authorizedEmails.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Debes proporcionar al menos un correo autorizado.' })
    }

    // Normalize emails to lowercase
    const normalizedEmails = authorizedEmails.map((e: string) => e.trim().toLowerCase()).filter(Boolean)

    return await prisma.announcement.create({
      data: {
        title: body.title,
        content: body.content || '',
        type: 'POLL',
        deadline: body.deadline ? new Date(body.deadline) : null,
        authorizedEmails: normalizedEmails,
        subjectId: body.subjectId,
        options: {
          create: options.map((label: string) => ({ label: label.trim() })),
        },
      },
      include: {
        options: true,
      },
    })
  }

  // COMMUNICATION (default)
  return await prisma.announcement.create({
    data: {
      title: body.title,
      content: body.content,
      type: 'COMMUNICATION',
      subjectId: body.subjectId,
    },
  })
})