import { describe, it, expect } from 'vitest'
import { isPollExpired, votePercentage, pluralVotes, resolveCheckStatus } from '../../app/utils/poll'

describe('isPollExpired', () => {
  const now = new Date('2026-01-10T00:00:00Z')
  it('false sin deadline', () => {
    expect(isPollExpired(null, now)).toBe(false)
    expect(isPollExpired(undefined, now)).toBe(false)
  })
  it('true si el deadline pasó', () => {
    expect(isPollExpired('2026-01-09T00:00:00Z', now)).toBe(true)
  })
  it('false si el deadline es futuro', () => {
    expect(isPollExpired('2026-01-11T00:00:00Z', now)).toBe(false)
  })
})

describe('votePercentage', () => {
  it('0 cuando no hay votos', () => {
    expect(votePercentage(0, 0)).toBe(0)
    expect(votePercentage(3, null)).toBe(0)
    expect(votePercentage(3, undefined)).toBe(0)
  })
  it('redondea', () => {
    expect(votePercentage(1, 3)).toBe(33)
    expect(votePercentage(2, 3)).toBe(67)
    expect(votePercentage(5, 5)).toBe(100)
  })
})

describe('pluralVotes', () => {
  it('singular y plural', () => {
    expect(pluralVotes(1)).toBe('voto')
    expect(pluralVotes(0)).toBe('votos')
    expect(pluralVotes(1, true)).toBe('voto total')
    expect(pluralVotes(2, true)).toBe('votos totales')
  })
})

describe('resolveCheckStatus', () => {
  it('prioridad expired > hasVoted > authorized > not_authorized', () => {
    expect(resolveCheckStatus({ isExpired: true, hasVoted: true, authorized: true })).toBe('expired')
    expect(resolveCheckStatus({ isExpired: false, hasVoted: true, authorized: true })).toBe('already_voted')
    expect(resolveCheckStatus({ isExpired: false, hasVoted: false, authorized: true })).toBe('authorized')
    expect(resolveCheckStatus({ isExpired: false, hasVoted: false, authorized: false })).toBe('not_authorized')
  })
})
