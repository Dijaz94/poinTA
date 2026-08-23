import { serverSupabaseUser } from '#supabase/server'

const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api')) return

  let user = null
  try {
    user = await serverSupabaseUser(event)
  } catch {
    user = null
  }
  const email = user?.email ?? user?.user_metadata?.email

  let pointaUser = null
  if (user && email) {
    const role = adminEmails.includes(email.toLowerCase()) ? 'ADMIN' : 'TA'

    // Only look up existing Prisma users — never auto-create.
    // Users are created explicitly via POST /api/admin/users.
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      if (existing.role !== role) {
        pointaUser = await prisma.user.update({
          where: { email },
          data: { role: role as any }
        })
      } else {
        pointaUser = existing
      }
    }
    // If no Prisma record exists, pointaUser stays null → assertTa will reject.
  }

  event.context.pointaUser = pointaUser

  if (event.path.startsWith('/api/admin')) {
    assertTa(event)
  }
})