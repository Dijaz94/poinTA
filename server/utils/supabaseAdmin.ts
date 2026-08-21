import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Searches for a user in Supabase Auth by email (case-insensitive) across pages.
 */
export async function findAuthUserByEmail(admin: SupabaseClient, email: string) {
  const targetEmail = email.trim().toLowerCase()
  let page = 1
  const perPage = 100

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error || !data?.users?.length) {
      break
    }

    const match = data.users.find(u => u.email?.toLowerCase() === targetEmail)
    if (match) {
      return match
    }

    if (data.users.length < perPage) {
      break
    }
    page++
  }

  return null
}

/**
 * Safely deletes a user from Supabase Auth by ID, falling back to email lookup if ID doesn't match.
 */
export async function deleteAuthUserSafely(admin: SupabaseClient, id: string, email?: string) {
  const { error } = await admin.auth.admin.deleteUser(id)
  if (!error) {
    return { ok: true }
  }

  if (error.message === 'User not found' && email) {
    console.warn(`User ${id} not found in Supabase Auth by ID. Attempting lookup by email: ${email}`)
    const authUser = await findAuthUserByEmail(admin, email)
    if (authUser) {
      const { error: delError } = await admin.auth.admin.deleteUser(authUser.id)
      if (delError) {
        throw delError
      }
      return { ok: true, deletedId: authUser.id }
    }
    // If not found in Auth at all, it was already deleted
    return { ok: true, alreadyGone: true }
  }

  if (error.message === 'User not found') {
    return { ok: true, alreadyGone: true }
  }

  throw error
}
