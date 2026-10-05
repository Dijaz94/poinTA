export type PollCheckStatus = 'idle' | 'authorized' | 'not_authorized' | 'already_voted' | 'expired'

export interface PollCheckResponse {
  authorized: boolean
  hasVoted: boolean
  votedOptionId: string | null
  isExpired: boolean
}

export function isPollExpired(deadline?: string | null, now: Date = new Date()): boolean {
  if (!deadline) return false
  return now > new Date(deadline)
}

export function votePercentage(voteCount: number, totalVotes?: number | null): number {
  const total = totalVotes ?? 0
  if (total <= 0) return 0
  return Math.round((voteCount / total) * 100)
}

export function pluralVotes(count: number, total = false): string {
  if (total) return count === 1 ? 'voto total' : 'votos totales'
  return count === 1 ? 'voto' : 'votos'
}

export function resolveCheckStatus(
  res: Pick<PollCheckResponse, 'authorized' | 'hasVoted' | 'isExpired'>,
): PollCheckStatus {
  if (res.isExpired) return 'expired'
  if (res.hasVoted) return 'already_voted'
  if (res.authorized) return 'authorized'
  return 'not_authorized'
}
