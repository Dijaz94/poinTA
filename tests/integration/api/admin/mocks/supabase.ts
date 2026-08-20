export const serverSupabaseUser = async (event: any) => {
  const role = event.node.req.headers['x-mock-role']
  
  if (role === 'ADMIN') {
    return {
      id: 'mock-admin-id',
      email: 'admin@example.com',
      user_metadata: { name: 'Admin Test' }
    }
  }

  if (role === 'TA') {
    return {
      id: 'mock-ta-id',
      email: 'ta@example.com',
      user_metadata: { name: 'TA Test' }
    }
  }

  // No mock user
  return null
}
