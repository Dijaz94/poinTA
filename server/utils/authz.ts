import type { H3Event } from 'h3'

export function getTa(event: H3Event) {
  return event.context.pointaUser ?? null
}

export function assertTa(event: H3Event) {
  const ta = getTa(event)
  if (!ta) {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado: debes iniciar sesión.' })
  }
  if (ta.isActive === false) {
    throw createError({ statusCode: 403, statusMessage: 'Tu cuenta ha sido desactivada. Contacta a un administrador.' })
  }
  return ta
}

export function assertAdmin(event: H3Event) {
  const ta = assertTa(event)
  if (ta.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'No tienes permisos de administrador.' })
  }
  return ta
}

export async function assertTaCanModify(event: H3Event, subjectId: string) {
  const ta = assertTa(event)

  if (ta.role === 'ADMIN') {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!subject) {
      throw createError({ statusCode: 404, statusMessage: 'Asignatura no encontrada.' })
    }
    return subject
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
