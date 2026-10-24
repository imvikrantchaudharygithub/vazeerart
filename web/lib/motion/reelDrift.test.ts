// web/lib/motion/reelDrift.test.ts
import {describe, expect, it} from 'vitest'
import {REEL_DRIFT} from './constants'
import {advance, canMove, clampDt, isUserScroll, needsDrift, normalize} from './reelDrift'

describe('reelDrift', () => {
  it('clamps frame deltas to [0, MAX_DT_MS]', () => {
    expect(clampDt(-5)).toBe(0)
    expect(clampDt(16)).toBe(16)
    expect(clampDt(5000)).toBe(REEL_DRIFT.MAX_DT_MS)
  })
  it('advances at the given speed and wraps on the set pitch', () => {
    expect(advance(0, 100, 2950, 30)).toBe(3)
    expect(advance(0, 1000, 2950, 30)).toBe(3) // a 1 s frame is clamped to MAX_DT_MS
    expect(advance(0, 100, 2950)).toBeCloseTo(REEL_DRIFT.SPEED_PX_S / 10)
    expect(advance(2949, 100, 2950, 30)).toBeCloseTo(2)
    expect(advance(10, 100, 0, 30)).toBe(0)
  })
  it('folds any offset onto the first set', () => {
    expect(normalize(0, 100)).toBe(0)
    expect(normalize(100, 100)).toBe(0)
    expect(normalize(250, 100)).toBe(50)
    expect(normalize(-30, 100)).toBe(70)
    expect(normalize(42, 0)).toBe(0)
  })
  it('drifts only when the rail can scroll by a whole set', () => {
    expect(needsDrift(2950, 4542)).toBe(true)
    expect(needsDrift(1180, 1002)).toBe(false)
    expect(needsDrift(0, 4542)).toBe(false)
    expect(needsDrift(2950, NaN)).toBe(false)
  })
  it('tells the visitor scroll from our own writes', () => {
    expect(isUserScroll(100.4, 100)).toBe(false)
    expect(isUserScroll(103, 100)).toBe(true)
    expect(isUserScroll(50, 100)).toBe(true)
  })
  it('moves only on screen, unhovered, unfocused, and RESUME_MS after the last visitor scroll', () => {
    const base = {visible: true, hovered: false, focused: false, now: 10_000, lastUserScroll: -Infinity}
    expect(canMove(base)).toBe(true)
    expect(canMove({...base, visible: false})).toBe(false)
    expect(canMove({...base, hovered: true})).toBe(false)
    expect(canMove({...base, focused: true})).toBe(false)
    expect(canMove({...base, lastUserScroll: 10_000 - REEL_DRIFT.RESUME_MS + 1})).toBe(false)
    expect(canMove({...base, lastUserScroll: 10_000 - REEL_DRIFT.RESUME_MS})).toBe(true)
  })
})
