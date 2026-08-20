export default defineEventHandler(async (event) => {
  const ta = getTa(event)
  if (!ta) {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado.' })
  }
  return { email: ta.email, role: ta.role, name: ta.name }
})