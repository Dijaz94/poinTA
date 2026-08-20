import { prisma } from './prisma'

/**
 * Devuelve el ayudante (usuario Prisma) asociado a la sesión actual.
 * El middleware `server/middleware/admin.ts` se encarga de sincronizar el
 * usuario de Supabase Auth con la tabla `User` y lo guarda en el contexto.
 */
export function getTa(event: H3Event) {
  return event.context.pointaUser ?? null
}

/**
 * Verifica que la asignatura exista (404) y que el ayudante autenticado
 * esté asignado a ella (403). Devuelve la asignatura si el TA puede editarla.
 */
export async function assertTaCanModify(event: H3Event, subjectId: string) {
  const ta = getTa(event)
  if (!ta) {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado: debes iniciar sesión.' })
  }

  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, users: { some: { id: ta.id } } },
  })

  if (!subject) {
    const exists = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!exists) {
      throw createError({ statusCode: 404, statusMessage: 'Asignatura no encontrada.' })
    }
    throw createError({
      statusCode: 403,
      statusMessage: 'No tienes permisos para administrar esta asignatura.',
    })
  }

  return subject
}