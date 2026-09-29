import {describe, expect, it} from 'vitest'
import {PARALLAX} from './constants'
import {lerp, parallaxTransform} from './parallax'

describe('lerp', () => {
  it('moves 8% toward the target (prototype 0.08)', () => {
    expect(PARALLAX.LERP).toBe(0.08)
    expect(lerp(0, 1, PARALLAX.LERP)).toBeCloseTo(0.08)
  })
})

describe('parallaxTransform', () => {
  it('matches translate3d(cx*d*28, cy*d*20 + min(scrollY,1200)*k, 0)', () => {
    expect(parallaxTransform(0.5, -0.25, 2, -0.45, 300)).toBe('translate3d(28.00px,-145.00px,0)')
  })
  it('caps scroll at 1200', () => {
    expect(parallaxTransform(0, 0, 1, 0.1, 5000)).toBe('translate3d(0.00px,120.00px,0)')
  })
})
