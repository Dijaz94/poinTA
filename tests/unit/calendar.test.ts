import { describe, it, expect } from 'vitest'
import {
  findNextSession,
  buildIcsContent,
  buildGoogleCalendarUrl,
  formatTimeRemaining,
} from '../../app/utils/calendar'
import type { Session } from '../../app/types/sessions'

describe('calendar utils', () => {
  const sampleSessions: Session[] = [
    {
      id: 's1',
      title: 'Ayudantía Cátedra 1',
      isRecurring: true,
      dayOfWeek: 'WEDNESDAY',
      startTime: '14:30',
      endTime: '16:00',
      location: 'Sala B-204',
    },
    {
      id: 's2',
      title: 'Ayudantía Laboratorio',
      isRecurring: true,
      dayOfWeek: 'FRIDAY',
      startTime: '10:00',
      endTime: '11:30',
      location: 'Lab LDS',
    },
  ]

  it('debería encontrar la próxima sesión del mismo día si aún no termina', () => {
    // Miércoles 15 Oct 2025 a las 12:00
    const now = new Date(2025, 9, 15, 12, 0, 0)
    const next = findNextSession(sampleSessions, now)
    expect(next).not.toBeNull()
    expect(next?.session.id).toBe('s1')
    expect(next?.isToday).toBe(true)
    expect(next?.dayText).toBe('Hoy')
    expect(next?.timeRange).toBe('14:30 – 16:00')
  })

  it('debería pasar a la siguiente sesión de la semana si la de hoy ya terminó', () => {
    // Miércoles 15 Oct 2025 a las 17:30
    const now = new Date(2025, 9, 15, 17, 30, 0)
    const next = findNextSession(sampleSessions, now)
    expect(next).not.toBeNull()
    expect(next?.session.id).toBe('s2')
    expect(next?.isToday).toBe(false)
    expect(next?.dayText).toBe('Viernes')
  })

  it('debería generar contenido .ics válido con RRULE semanal', () => {
    const now = new Date(2025, 9, 15, 12, 0, 0)
    const ics = buildIcsContent(sampleSessions[0]!, 'Estructuras de Datos', now)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('SUMMARY:Ayudantía Cátedra 1 — Estructuras de Datos')
    expect(ics).toContain('LOCATION:Sala B-204')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=WE')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('debería generar un enlace de Google Calendar con los parámetros correctos', () => {
    const now = new Date(2025, 9, 15, 12, 0, 0)
    const url = buildGoogleCalendarUrl(sampleSessions[0]!, 'Estructuras de Datos', now)
    expect(url).toContain('https://calendar.google.com/calendar/render?')
    expect(url).toContain('action=TEMPLATE')
    expect(url).toContain('Sala+B-204')
  })

  it('debería formatear correctamente el tiempo restante de un plazo', () => {
    const now = new Date('2026-05-10T10:00:00Z')
    expect(formatTimeRemaining('2026-05-10T15:30:00Z', now)).toBe('Cierra en 5h')
    expect(formatTimeRemaining('2026-05-13T10:00:00Z', now)).toBe('Cierra en 3 días')
    expect(formatTimeRemaining('2026-05-09T10:00:00Z', now)).toBe('Plazo cerrado')
  })
})
