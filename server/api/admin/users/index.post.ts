import { serverSupabaseServiceRole } from '#supabase/server'
import { findAuthUserByEmail } from '~~/server/utils/supabaseAdmin'

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

  let authUserId = data?.user?.id

  if (error) {
    if (error.message.toLowerCase().includes('already') || (error as any).status === 422) {
      const existingAuth = await findAuthUserByEmail(admin, email)
      if (existingAuth) {
        authUserId = existingAuth.id
        const { error: updateAuthErr } = await admin.auth.admin.updateUserById(existingAuth.id, {
          password,
          user_metadata: { full_name: name },
        })
        if (updateAuthErr) {
          throw createError({ statusCode: 400, statusMessage: updateAuthErr.message })
        }
      } else {
        throw createError({ statusCode: 400, statusMessage: error.message })
      }
    } else {
      throw createError({ statusCode: 400, statusMessage: error.message })
    }
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role: 'TA', ...(authUserId ? { id: authUserId } : {}) },
    create: { id: authUserId, name, email, role: 'TA' },
  })

  if (subjectIds?.length) {
    await prisma.user.update({
      where: { id: user.id },
      data: { subjects: { connect: subjectIds.map(id => ({ id })) } },
    })
  }

  return { id: user.id, email: user.email, name: user.name, role: user.role }
})