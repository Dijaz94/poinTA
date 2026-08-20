const TZ = 'America/Santiago'

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatFullDate(value: string | Date | null | undefined): string {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: TZ,
    dateStyle: 'full',
  }).format(new Date(value))
}