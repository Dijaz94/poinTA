export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await assertTaCanModify(event, body.subjectId)

  return await prisma.announcement.create({
    data: {
      title: body.title,
      content: body.content,
      subjectId: body.subjectId,
    },
  })
})