export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await assertTaCanModify(event, body.subjectId)

  return await prisma.session.create({
    data: {
      title: body.title,
      isRecurring: body.isRecurring ?? true,
      dayOfWeek: body.dayOfWeek ?? null,
      date: body.date ? new Date(body.date) : null,
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location,
      subjectId: body.subjectId,
    },
  })
})