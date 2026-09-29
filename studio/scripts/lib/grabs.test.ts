// studio/scripts/lib/grabs.test.ts
import {describe, expect, it} from 'vitest'
import {GRAB_POOL, grabKeysFor, lexoRank} from './grabs'

describe('grabKeysFor', () => {
  it('matches the prototype: grabPool[(i*3+n) % 16]', () => {
    expect(GRAB_POOL).toHaveLength(16)
    expect(grabKeysFor(0)).toEqual(['C', 'E', 'F', 'G'])
    expect(grabKeysFor(1)).toEqual(['G', 'H', 'I', 'J'])
    expect(grabKeysFor(2)).toEqual(['J', 'K', 'N', 'O'])
    expect(grabKeysFor(3)).toEqual(['O', 'Q', 'R', 'T'])
    expect(grabKeysFor(4)).toEqual(['T', 'V', 'W', 'L'])
  })
})

describe('lexoRank', () => {
  it('produces valid, lexicographically ordered LexoRank strings', () => {
    const ranks = [0, 1, 2, 10, 34].map(lexoRank)
    expect(ranks[0]).toBe('0|100000:')
    expect(ranks[1]).toBe('0|200000:')
    expect(ranks[3]).toBe('0|b00000:')
    for (let i = 1; i < ranks.length; i++) expect(ranks[i] > ranks[i - 1]).toBe(true)
  })
})
