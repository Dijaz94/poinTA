export const DAYS = [
  { value: 'MONDAY', label: 'Lunes', order: 1 },
  { value: 'TUESDAY', label: 'Martes', order: 2 },
  { value: 'WEDNESDAY', label: 'Miércoles', order: 3 },
  { value: 'THURSDAY', label: 'Jueves', order: 4 },
  { value: 'FRIDAY', label: 'Viernes', order: 5 },
  { value: 'SATURDAY', label: 'Sábado', order: 6 },
  { value: 'SUNDAY', label: 'Domingo', order: 7 },
] as const

export type DayValue = (typeof DAYS)[number]['value']

export const DAY_LABELS: Record<string, string> = Object.fromEntries(
  DAYS.map((d) => [d.value, d.label]),
)

export const DAY_ORDERS: Record<string, number> = Object.fromEntries(
  DAYS.map((d) => [d.value, d.order]),
)

export function dayLabel(day: string | null | undefined): string {
  if (!day) return ''
  return DAY_LABELS[day] ?? day
}