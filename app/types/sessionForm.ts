export interface SessionForm {
    id: string | null
    title: string
    isRecurring: boolean
    dayOfWeek: string
    date: string
    startTime: string
    endTime: string
    location: string
}