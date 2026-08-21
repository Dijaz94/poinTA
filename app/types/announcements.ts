export interface PollOptionData {
  id: string
  label: string
  voteCount: number
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: 'COMMUNICATION' | 'POLL'
  deadline: string | null
  createdAt: string
  subjectId: string
  options: PollOptionData[]
  totalVotes: number
}
