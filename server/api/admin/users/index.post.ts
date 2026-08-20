import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  assertAdmin(event)

  const body = await readBody(event)
  const { email, password, name, subjectIds } = body as {
    email: string
    password: string
    name: string
    subjectIds?: string[]
  }

  if (!email || !password || !name) {
    throw createError({ statusCode: 400, statusMessage: 'email, password y name son requeridos.' })
  }

  const admin = serverSupabaseServiceRole(event)

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  })

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role: 'TA' },
    create: { id: data.user.id, name, email, role: 'TA' },
  })

  if (subjectIds?.length) {
    await prisma.user.update({
      where: { id: user.id },
      data: { subjects: { connect: subjectIds.map(id => ({ id })) } },
    })
  }

  return { id: user.id, email: user.email, name: user.name, role: user.role }
})