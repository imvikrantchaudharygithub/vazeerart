// web/components/sections/ReelsRail/ReelDrift.test.tsx
import {cleanup, render} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {REEL_DRIFT} from '@/lib/motion/constants'
import {ReelDrift} from './ReelDrift'

const CARD = 576
const GAP = 14
const PAD = 48
const SET = 5 * (CARD + GAP) // 2950: one set's pitch at 1440

type Rail = {
  rail: HTMLElement
  frame: (t: number) => void
  show: (visible: boolean) => void
  scrollTo: (x: number) => void
  rafCalls: () => number
  unmount: () => void
}

/** A rail with `cards` cards and their clones, laid out as at 1440 px; rAF and IntersectionObserver are hand-driven. */
function mount(opts: {reducedMotion?: boolean; cards?: number} = {}): Rail {
  const cards = opts.cards ?? 5
  const set = cards * (CARD + GAP)
  const rail = document.createElement('div')
  rail.dataset.reelRail = ''
  const clones = document.createElement('div')
  clones.dataset.reelClone = ''
  for (let i = 0; i < cards; i++) {
    rail.appendChild(document.createElement('a'))
    clones.appendChild(document.createElement('a'))
  }
  rail.appendChild(clones)
  ;(rail.firstElementChild as HTMLElement).getBoundingClientRect = () => ({left: PAD} as DOMRect)
  ;(clones.firstElementChild as HTMLElement).getBoundingClientRect = () => ({left: PAD + set} as DOMRect)
  let scrollLeft = 0
  Object.defineProperty(rail, 'scrollLeft', {get: () => scrollLeft, set: (v: number) => { scrollLeft = v }, configurable: true})
  Object.defineProperty(rail, 'clientWidth', {value: 1440, configurable: true})
  Object.defineProperty(rail, 'scrollWidth', {value: 2 * PAD + 2 * set - GAP, configurable: true})
  document.body.appendChild(rail)

  let pending: FrameRequestCallback | null = null
  let rafCalls = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { pending = cb; rafCalls++; return rafCalls })
  vi.stubGlobal('cancelAnimationFrame', () => { pending = null })
  vi.stubGlobal('matchMedia', () => ({matches: !!opts.reducedMotion}))
  let onIntersect: (entries: {isIntersecting: boolean}[]) => void = () => {}
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: typeof onIntersect) { onIntersect = cb }
    observe() {}
    disconnect() {}
  })
  const {unmount} = render(<ReelDrift />)
  return {
    rail,
    frame: (t) => { const cb = pending; pending = null; cb?.(t) },
    show: (visible) => onIntersect([{isIntersecting: visible}]),
    scrollTo: (x) => { scrollLeft = x; rail.dispatchEvent(new Event('scroll')) },
    rafCalls: () => rafCalls,
    unmount,
  }
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const perFrame = (REEL_DRIFT.SPEED_PX_S / 1000) * 100 // px per 100 ms frame

describe('ReelDrift', () => {
  it('does nothing under prefers-reduced-motion', () => {
    const r = mount({reducedMotion: true})
    expect(r.rail.dataset.drift).toBeUndefined()
    expect(r.rafCalls()).toBe(0)
  })
  it('stays a plain row with the clones hidden when one set fits the rail', () => {
    const r = mount({cards: 2}) // pitch 1180, but the rail only scrolls 1002
    r.show(true)
    expect(r.rail.dataset.drift).toBeUndefined()
    expect(r.rafCalls()).toBe(0)
  })
  it('shows the clones at once, then glides at SPEED_PX_S once the rail is on screen, clamping long frames', () => {
    const r = mount()
    expect(r.rail.dataset.drift).toBe('paused')
    expect(r.rafCalls()).toBe(0)
    r.show(true)
    r.frame(0)
    expect(r.rail.dataset.drift).toBe('on')
    expect(r.rail.scrollLeft).toBe(0)
    r.frame(100)
    expect(r.rail.scrollLeft).toBeCloseTo(perFrame)
    r.frame(5100) // 5 s away (background tab): clamped to MAX_DT_MS, no jump
    expect(r.rail.scrollLeft).toBeCloseTo(perFrame + (REEL_DRIFT.SPEED_PX_S / 1000) * REEL_DRIFT.MAX_DT_MS)
  })
  it('ignores the scroll events its own writes produce', () => {
    const r = mount()
    r.show(true)
    r.frame(0)
    r.frame(100)
    r.rail.dispatchEvent(new Event('scroll'))
    r.frame(200)
    expect(r.rail.dataset.drift).toBe('on')
    expect(r.rail.scrollLeft).toBeCloseTo(2 * perFrame)
  })
  it('pauses under the pointer and resumes on leave', () => {
    const r = mount()
    r.show(true)
    r.frame(0)
    r.frame(100)
    r.rail.dispatchEvent(new Event('pointerenter'))
    r.frame(200)
    expect(r.rail.dataset.drift).toBe('paused')
    expect(r.rail.scrollLeft).toBeCloseTo(perFrame)
    r.rail.dispatchEvent(new Event('pointerleave'))
    r.frame(300)
    expect(r.rail.dataset.drift).toBe('on')
    expect(r.rail.scrollLeft).toBeCloseTo(2 * perFrame)
  })
  it('pauses while a card has focus', () => {
    const r = mount()
    r.show(true)
    r.frame(0)
    r.rail.dispatchEvent(new Event('focusin'))
    r.frame(100)
    expect(r.rail.scrollLeft).toBe(0)
    r.rail.dispatchEvent(new Event('focusout'))
    r.frame(200)
    expect(r.rail.scrollLeft).toBeCloseTo(perFrame)
  })
  it('waits RESUME_MS after the visitor scrolls the rail, then resumes from where they left it', () => {
    const r = mount()
    r.show(true)
    r.frame(0)
    r.frame(100)
    vi.spyOn(performance, 'now').mockReturnValue(100)
    r.scrollTo(500)
    expect(r.rail.dataset.drift).toBe('paused')
    r.frame(100 + REEL_DRIFT.RESUME_MS - 1)
    expect(r.rail.scrollLeft).toBe(500)
    r.frame(100 + REEL_DRIFT.RESUME_MS)
    expect(r.rail.dataset.drift).toBe('on')
    expect(r.rail.scrollLeft).toBeCloseTo(500 + REEL_DRIFT.SPEED_PX_S / 1000, 3)
  })
  it('folds a swipe into the clone set back onto the first set and wraps seamlessly', () => {
    const r = mount()
    r.show(true)
    r.frame(0)
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    r.scrollTo(SET - 1)
    r.frame(1000 + REEL_DRIFT.RESUME_MS) // one clamped frame: 2949 + 3 − 2950
    expect(r.rail.scrollLeft).toBeCloseTo(perFrame - 1)
  })
  it('stops the frame loop while the rail is off screen and restarts when it returns', () => {
    const r = mount()
    r.show(true)
    r.frame(0)
    const scheduled = r.rafCalls()
    r.show(false)
    r.frame(100) // the frame already queued runs once more and does not reschedule
    expect(r.rafCalls()).toBe(scheduled)
    expect(r.rail.scrollLeft).toBe(0)
    r.show(true)
    expect(r.rafCalls()).toBe(scheduled + 1)
  })
  it('removes its state attribute on unmount', () => {
    const r = mount()
    r.show(true)
    r.frame(0)
    r.unmount()
    expect(r.rail.dataset.drift).toBeUndefined()
  })
})
