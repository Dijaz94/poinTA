import { describe, it, expect } from 'vitest'
import handler from '../../../../server/api/admin/users/index.get'

describe('API GET /api/admin/users (Direct Handler Test)', () => {
  it('debería arrojar error 401 si no hay usuario en el contexto', async () => {
    const event = {
      context: {}
    } as any

    try {
      await handler(event)
      expect.unreachable('Debería haber arrojado error 401')
    } catch (e: any) {
      expect(e.message).toBe('No autorizado: debes iniciar sesión.')
    }
  })

  it('debería arrojar error 403 si el usuario no es ADMIN', async () => {
    const event = {
      context: {
        pointaUser: { role: 'TA', isActive: true }
      }
    } as any

    try {
      await handler(event)
      expect.unreachable('Debería haber arrojado error 403')
    } catch (e: any) {
      expect(e.message).toBe('No tienes permisos de administrador.')
    }
  })

  it('debería devolver la lista de usuarios si es ADMIN', async () => {
    const event = {
      context: {
        pointaUser: { role: 'ADMIN', isActive: true }
      }
    } as any
    
    const response = await handler(event)
    
    expect(Array.isArray(response)).toBe(true)
    if (response.length > 0) {
      const firstUser = response[0]
      expect(firstUser).toHaveProperty('id')
      expect(firstUser).toHaveProperty('name')
      expect(firstUser).toHaveProperty('email')
      expect(firstUser).toHaveProperty('role')
      expect(firstUser).toHaveProperty('isActive')
      expect(firstUser).toHaveProperty('subjects')
    }
  })
})
