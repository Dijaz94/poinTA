import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const subject = await prisma.subject.findUnique({ where: { id } })

  if (!subject) {
    throw createError({ statusCode: 404, statusMessage: 'Asignatura no encontrada.' })
  }

  return subject
})