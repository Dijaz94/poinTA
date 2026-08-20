import { vi } from 'vitest'
import { prisma } from '../server/utils/prisma'
import { assertAdmin } from '../server/utils/authz'

// Polyfill Nuxt/Nitro auto-imports
vi.stubGlobal('defineEventHandler', (handler: any) => handler)
vi.stubGlobal('createError', (err: any) => new Error(err.statusMessage))

vi.stubGlobal('prisma', prisma)
vi.stubGlobal('assertAdmin', assertAdmin)
