export interface Subject {
  id: string
  name: string
  code: string | null
  semester: string
  users?: { id: string; name: string }[]
  _count?: {
    materials: number
    announcements: number
    sessions: number
  }
}