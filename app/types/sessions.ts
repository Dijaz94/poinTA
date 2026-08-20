export interface Session {
  id: string
  title: string
  isRecurring: boolean
  dayOfWeek: string | null
  date: string | null
  startTime: string
  endTime: string
  location: string | null
  subjectId: string
}
