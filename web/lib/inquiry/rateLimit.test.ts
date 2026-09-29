// web/lib/inquiry/rateLimit.test.ts
import {describe, expect, it} from 'vitest'
import {allow} from './rateLimit'

describe('allow (per-IP token bucket, 5 per minute)', () => {
  it('allows 5 submissions and denies the 6th', () => {
    const t = 1_000_000
    for (let i = 0; i < 5; i++) expect(allow('ip-burst', t)).toBe(true)
    expect(allow('ip-burst', t)).toBe(false)
  })
  it('refills after 60 seconds', () => {
    const t = 2_000_000
    for (let i = 0; i < 5; i++) allow('ip-refill', t)
    expect(allow('ip-refill', t)).toBe(false)
    expect(allow('ip-refill', t + 60_000)).toBe(true)
  })
  it('refills gradually: one token every 12 seconds', () => {
    const t = 3_000_000
    for (let i = 0; i < 5; i++) allow('ip-gradual', t)
    expect(allow('ip-gradual', t + 6_000)).toBe(false)
    expect(allow('ip-gradual', t + 12_000)).toBe(true)
    expect(allow('ip-gradual', t + 12_000)).toBe(false)
  })
  it('keeps a separate bucket per IP', () => {
    const t = 4_000_000
    for (let i = 0; i < 5; i++) allow('ip-a', t)
    expect(allow('ip-a', t)).toBe(false)
    expect(allow('ip-b', t)).toBe(true)
  })
})
