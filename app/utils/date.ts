const TZ = 'America/Santiago'

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',

  }).format(new Date(value))
}

export function formatFullDate(value: string | Date | null | undefined): string {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'UTC',
    dateStyle: 'full',
  }).format(new Date(value))
}