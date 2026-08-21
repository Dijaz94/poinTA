import { serverSupabaseUser } from '#supabase/server'

const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api')) return

  const user = await serverSupabaseUser(event)
  const email = user?.email ?? user?.user_metadata?.email

  let pointaUser = null
  if (user && email) {
    const role = adminEmails.includes(email.toLowerCase()) ? 'ADMIN' : 'TA'
    
    // Only fetch to check existence or just update role
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
    } else {
      const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? email.split('@')[0]
      pointaUser = await prisma.user.create({
        data: { id: user.id, name, email, role: role as any }
      })
    }
  }

  event.context.pointaUser = pointaUser

  if (event.path.startsWith('/api/admin')) {
    assertTa(event)
  }
})