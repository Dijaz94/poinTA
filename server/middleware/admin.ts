import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Only protect /api routes that are mutations (POST, PUT, DELETE)
  if (event.path.startsWith('/api') && ['POST', 'PUT', 'DELETE'].includes(event.method)) {
    // Attempt to retrieve the authenticated user session from Supabase
    const user = await serverSupabaseUser(event)
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Solo los ayudantes autorizados pueden modificar los datos.',
      })
    }
  }
})
