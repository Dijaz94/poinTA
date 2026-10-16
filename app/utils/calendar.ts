import type { Session } from '../types/sessions'
import { DAY_LABELS } from './days'

const JS_DAY_TO_ENUM: Record<number, string> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
}

const ENUM_TO_JS_DAY: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
}

const ENUM_TO_ICS_BYDAY: Record<string, string> = {
  SUNDAY: 'SU',
  MONDAY: 'MO',
  TUESDAY: 'TU',
  WEDNESDAY: 'WE',
  THURSDAY: 'TH',
  FRIDAY: 'FR',
  SATURDAY: 'SA',
}

export function getCurrentDayEnum(now: Date = new Date()): string {
  return JS_DAY_TO_ENUM[now.getDay()] ?? 'MONDAY'
}

export interface NextSessionSummary {
  session: Session
  isToday: boolean
  isTomorrow: boolean
  dayText: string
  timeRange: string
  daysUntil: number
}

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (Number.isFinite(h) ? h! : 0) * 60 + (Number.isFinite(m) ? m! : 0)
}

export function findNextSession(sessions: Session[] | null | undefined, now: Date = new Date()): NextSessionSummary | null {
  if (!sessions || sessions.length === 0) return null

  const currentJsDay = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  let best: { session: Session; scoreMinutes: number; daysUntil: number; dayText: string } | null = null

  for (const s of sessions) {
    const startMins = parseMinutes(s.startTime)
    const endMins = parseMinutes(s.endTime)

    if (s.isRecurring && s.dayOfWeek && s.dayOfWeek in ENUM_TO_JS_DAY) {
      const targetDay = ENUM_TO_JS_DAY[s.dayOfWeek]!
      let daysUntil = (targetDay - currentJsDay + 7) % 7

      // Si es hoy pero ya terminó, pasa a la próxima semana
      if (daysUntil === 0 && endMins < currentMinutes) {
        daysUntil = 7
      }

      const scoreMinutes = daysUntil * 1440 + startMins
      const dayText = daysUntil === 0
        ? 'Hoy'
        : daysUntil === 1
          ? 'Mañana'
          : (DAY_LABELS[s.dayOfWeek] ?? s.dayOfWeek)

      if (!best || scoreMinutes < best.scoreMinutes) {
        best = { session: s, scoreMinutes, daysUntil, dayText }
      }
    } else if (!s.isRecurring && s.date) {
      const d = new Date(s.date)
      const sessionMidnight = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).getTime()
      const daysUntil = Math.round((sessionMidnight - todayMidnight) / 86400000)

      if (daysUntil < 0 || (daysUntil === 0 && endMins < currentMinutes)) {
        continue
      }

      const scoreMinutes = daysUntil * 1440 + startMins
      const dayText = daysUntil === 0
        ? 'Hoy'
        : daysUntil === 1
          ? 'Mañana'
          : new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', day: 'numeric', month: 'short' }).format(d)

      if (!best || scoreMinutes < best.scoreMinutes) {
        best = { session: s, scoreMinutes, daysUntil, dayText }
      }
    }
  }

  if (!best) return null

  return {
    session: best.session,
    isToday: best.daysUntil === 0,
    isTomorrow: best.daysUntil === 1,
    dayText: best.dayText,
    timeRange: `${best.session.startTime} – ${best.session.endTime}`,
    daysUntil: best.daysUntil,
  }
}

function getNextOccurrenceDate(session: Session, now: Date = new Date()): Date {
  if (!session.isRecurring && session.date) {
    const d = new Date(session.date)
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  }

  const targetDay = session.dayOfWeek ? (ENUM_TO_JS_DAY[session.dayOfWeek] ?? 1) : 1
  const currentDay = now.getDay()
  const daysUntil = (targetDay - currentDay + 7) % 7
  const result = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntil)
  return result
}

function formatIcsLocalDateTime(baseDate: Date, hhmm: string): string {
  const [hh = '00', mm = '00'] = hhmm.split(':')
  const y = baseDate.getFullYear()
  const m = String(baseDate.getMonth() + 1).padStart(2, '0')
  const d = String(baseDate.getDate()).padStart(2, '0')
  const h = String(hh).padStart(2, '0')
  const min = String(mm).padStart(2, '0')
  return `${y}${m}${d}T${h}${min}00`
}

export function buildIcsContent(session: Session, subjectName?: string, now: Date = new Date()): string {
  const baseDate = getNextOccurrenceDate(session, now)
  const dtStart = formatIcsLocalDateTime(baseDate, session.startTime)
  const dtEnd = formatIcsLocalDateTime(baseDate, session.endTime)
  const summary = subjectName ? `${session.title} — ${subjectName}` : session.title
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PoinTA//Plataforma de Ayudantias//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:pointa-session-${session.id}@pointa.cl`,
    `DTSTAMP:${formatIcsLocalDateTime(now, '00:00')}Z`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary.replace(/[,;\\]/g, ' ')}`,
  ]

  if (session.location) {
    lines.push(`LOCATION:${session.location.replace(/[,;\\]/g, ' ')}`)
  }

  if (session.isRecurring && session.dayOfWeek && ENUM_TO_ICS_BYDAY[session.dayOfWeek]) {
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${ENUM_TO_ICS_BYDAY[session.dayOfWeek]}`)
  }

  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadSessionIcs(session: Session, subjectName?: string): void {
  if (typeof window === 'undefined') return
  const ics = buildIcsContent(session, subjectName)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const slug = session.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'ayudantia'
  link.setAttribute('download', `${slug}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function buildGoogleCalendarUrl(session: Session, subjectName?: string, now: Date = new Date()): string {
  const baseDate = getNextOccurrenceDate(session, now)
  const dtStart = formatIcsLocalDateTime(baseDate, session.startTime)
  const dtEnd = formatIcsLocalDateTime(baseDate, session.endTime)
  const title = subjectName ? `${session.title} — ${subjectName}` : session.title

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${dtStart}/${dtEnd}`,
    details: `Sesión de ayudantía registrada en PoinTA${subjectName ? ` para ${subjectName}` : ''}.`,
  })

  if (session.location) {
    params.set('location', session.location)
  }

  if (session.isRecurring && session.dayOfWeek && ENUM_TO_ICS_BYDAY[session.dayOfWeek]) {
    params.set('recur', `RRULE:FREQ=WEEKLY;BYDAY=${ENUM_TO_ICS_BYDAY[session.dayOfWeek]}`)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function formatTimeRemaining(deadline: string | Date | null | undefined, now: Date = new Date()): string {
  if (!deadline) return ''
  const target = new Date(deadline).getTime()
  const diffMs = target - now.getTime()
  if (diffMs <= 0) return 'Plazo cerrado'

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 1) return `Cierra en ${diffDays} días`
  if (diffDays === 1) return 'Cierra mañana'
  if (diffHours >= 1) return `Cierra en ${diffHours}h`
  const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)))
  return `Cierra en ${diffMins} min`
}
