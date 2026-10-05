export interface PollState {
  email: string
  checking: boolean
  checkStatus: 'idle' | 'authorized' | 'not_authorized' | 'already_voted' | 'expired'
  selectedOptionId: string
  votedOptionId: string | null
  voting: boolean
  errorMessage: string
}