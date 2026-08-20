export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  await assertTaCanModify(event, body.subjectId)

  return await prisma.material.create({
    data: {
      title: body.title,
      description: body.description,
      fileUrl: body.fileUrl,
      subjectId: body.subjectId,
    },
  })
})