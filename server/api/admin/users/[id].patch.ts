import { serverSupabaseServiceRole } from '#supabase/server'
import { findAuthUserByEmail } from '~~/server/utils/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID de usuario requerido.' })
  }

  const currentAdmin = assertAdmin(event)

  const body = await readBody(event)
  const { role, isActive, addSubjectIds, removeSubjectIds, name, email, password } = body as {
    role?: 'ADMIN' | 'TA'
    isActive?: boolean
    addSubjectIds?: string[]
    removeSubjectIds?: string[]
    name?: string
    email?: string
    password?: string
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado.' })
  }

  // Prevent self-deactivation or self-demotion
  if (currentAdmin.id === id) {
    if (isActive === false) {
      throw createError({ statusCode: 400, statusMessage: 'No puedes desactivar tu propia cuenta de administrador.' })
    }
    if (role && role !== 'ADMIN') {
      throw createError({ statusCode: 400, statusMessage: 'No puedes quitarte el rol de administrador a ti mismo.' })
    }
  }

  const updates: any = {}
  const admin = serverSupabaseServiceRole(event)

  if (role) {
    updates.role = role
  }

  const emailProvided = email !== undefined
  const passwordProvided = !!password
  const nameProvided = name !== undefined

  if (nameProvided && name !== user.name) {
    updates.name = name
  }

  if (emailProvided && email !== user.email) {
    updates.email = email
  }

  // Always attempt to sync Supabase Auth to ensure `user_metadata` and credentials are up to date
  if (emailProvided || passwordProvided || nameProvided) {
    const authUpdates: any = {}
    if (emailProvided) {
      authUpdates.email = email
      authUpdates.email_confirm = true
    }
    if (passwordProvided) {
      authUpdates.password = password
    }
    if (nameProvided) {
      authUpdates.user_metadata = { full_name: name }
    }

    const { error: authError } = await admin.auth.admin.updateUserById(id, authUpdates)
    if (authError) {
      if (authError.message === 'User not found') {
        const targetEmail = email ?? user.email
        const existingAuthUser = await findAuthUserByEmail(admin, targetEmail)
        if (existingAuthUser) {
          const { error: updateErr } = await admin.auth.admin.updateUserById(existingAuthUser.id, authUpdates)
          if (updateErr) {
            throw createError({ statusCode: 400, statusMessage: `Error al actualizar credenciales: ${updateErr.message}` })
          }
        } else {
          console.warn(`User ${id} not found in Supabase Auth. Re-creating auth record.`)
          const createPayload: any = {
            id,
            email: targetEmail,
            email_confirm: true,
            user_metadata: { full_name: name ?? user.name },
          }
          if (passwordProvided) {
            createPayload.password = password
          }
          const { error: createAuthError } = await admin.auth.admin.createUser(createPayload)
          if (createAuthError) {
            throw createError({
              statusCode: 400,
              statusMessage: `Error al re-crear credenciales en Auth: ${createAuthError.message}`,
            })
          }
        }
      } else {
        throw createError({ statusCode: 400, statusMessage: `Error al actualizar credenciales: ${authError.message}` })
      }
    }
  }

  if (typeof isActive === 'boolean' && isActive !== user.isActive) {
    updates.isActive = isActive

    const ban_duration = isActive ? 'none' : '876000h'
    const { error: banError } = await admin.auth.admin.updateUserById(id, { ban_duration })
    if (banError) {
      if (banError.message === 'User not found') {
        const targetEmail = email ?? user.email
        const existingAuthUser = await findAuthUserByEmail(admin, targetEmail)
        if (existingAuthUser) {
          await admin.auth.admin.updateUserById(existingAuthUser.id, { ban_duration })
        } else {
          console.warn(`User ${id} not found in Supabase Auth. Skipping ban update.`)
        }
      } else {
        throw createError({ statusCode: 400, statusMessage: `Error al sincronizar estado en Supabase: ${banError.message}` })
      }
    }
  }

  if (addSubjectIds?.length) {
    updates.subjects = { connect: addSubjectIds.map(sid => ({ id: sid })) }
  }

  if (removeSubjectIds?.length) {
    updates.subjects = { ...updates.subjects, disconnect: removeSubjectIds.map(sid => ({ id: sid })) }
  }

  await prisma.user.update({ where: { id }, data: updates })

  const updated = await prisma.user.findUnique({
    where: { id },
    include: { subjects: { select: { id: true, name: true } } },
  })

  return {
    id: updated!.id,
    email: updated!.email,
    name: updated!.name,
    role: updated!.role,
    isActive: updated!.isActive,
    subjects: updated!.subjects,
  }
})