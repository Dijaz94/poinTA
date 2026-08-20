export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'TA'
  isActive: boolean
  subjects?: { id: string; name: string; code?: string }[]
}

export interface Me {
  email: string
  role: 'ADMIN' | 'TA'
  name: string
}
