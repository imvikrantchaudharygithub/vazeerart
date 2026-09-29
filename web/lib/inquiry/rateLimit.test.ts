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
  it('a clock step-back neither drains nor refills the bucket', () => {
    const t = 5_000_000
    for (let i = 0; i < 5; i++) allow('ip-stepback', t)
    expect(allow('ip-stepback', t + 60_000)).toBe(true) // bucket refilled to 5, one used: 4 left
    // The clock jumps two minutes back: no negative refill (the 4 tokens are still there) ...
    for (let i = 0; i < 4; i++) expect(allow('ip-stepback', t - 60_000)).toBe(true)
    expect(allow('ip-stepback', t - 60_000)).toBe(false)
    // ... and when it recovers, the time it "re-covers" is not counted as new refill.
    expect(allow('ip-stepback', t + 60_000)).toBe(false)
  })
  it('keeps a separate bucket per IP', () => {
    const t = 4_000_000
    for (let i = 0; i < 5; i++) allow('ip-a', t)
    expect(allow('ip-a', t)).toBe(false)
    expect(allow('ip-b', t)).toBe(true)
  })
})
