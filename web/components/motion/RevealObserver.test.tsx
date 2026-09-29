// web/components/motion/RevealObserver.test.tsx
import {render} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {revealTransition} from '@/lib/motion/reveal'
import {RevealObserver} from './RevealObserver'

type Entry = {isIntersecting: boolean; target: Element}
let observed: Element[] = []
let disconnects = 0
let trigger: (entries: Entry[]) => void = () => {}

beforeEach(() => {
  observed = []
  disconnects = 0
  vi.useFakeTimers()
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: (e: Entry[]) => void) { trigger = cb }
    observe = (el: Element) => { observed.push(el) }
    unobserve = () => {}
    disconnect = () => { disconnects++ }
  })
  Object.defineProperty(window, 'innerHeight', {value: 1000, configurable: true})
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

function mount(top: number) {
  const el = document.createElement('div')
  el.setAttribute('data-reveal', '1')
  el.getBoundingClientRect = () => ({top} as DOMRect)
  document.body.appendChild(el)
  return el
}

describe('RevealObserver', () => {
  it('hides below-fold elements, observes them, and reveals on intersection', () => {
    const el = mount(1500)
    render(<RevealObserver />)
    vi.advanceTimersByTime(60)
    expect(el.style.opacity).toBe('0')
    expect(el.style.translate).toBe('0 56px')
    expect(el.dataset.rv).toBe('1')
    expect(observed).toContain(el)
    trigger([{isIntersecting: true, target: el}])
    expect(el.style.opacity).toBe('1')
    expect(el.style.translate).toBe('0 0')
    el.remove()
  })
  it('skips elements already in view', () => {
    const el = mount(200)
    render(<RevealObserver />)
    vi.advanceTimersByTime(60)
    expect(el.style.opacity).toBe('')
    expect(el.dataset.rv).toBe('1')
    expect(observed).not.toContain(el)
    el.remove()
  })
  it('keeps one observer for its lifetime so pending elements survive a route change', async () => {
    const pending = mount(1500)
    render(<RevealObserver />)
    vi.advanceTimersByTime(60)
    expect(observed).toEqual([pending])
    expect(pending.style.opacity).toBe('0')

    // Simulate new route content arriving in the DOM.
    const next = mount(1600)
    await Promise.resolve() // MutationObserver delivery (microtask)
    await Promise.resolve()
    vi.advanceTimersByTime(20) // debounced rAF rescan

    expect(disconnects).toBe(0)
    expect(observed).toEqual([pending, next])
    expect(pending.dataset.rv).toBe('1')

    // The original observer still reveals the element stamped before the change.
    trigger([{isIntersecting: true, target: pending}])
    expect(pending.style.opacity).toBe('1')
    pending.remove()
    next.remove()
  })
  it('ignores text-only mutations, rescans on element insertions', async () => {
    const span = document.createElement('span')
    span.textContent = 'a'
    document.body.appendChild(span)
    render(<RevealObserver />)
    vi.advanceTimersByTime(60) // initial scan

    const qs = vi.spyOn(document, 'querySelectorAll')
    span.textContent = 'b' // replaces the text node: a childList mutation with no added elements
    await Promise.resolve()
    await Promise.resolve()
    vi.advanceTimersByTime(20)
    expect(qs).not.toHaveBeenCalled()

    const before = qs.mock.calls.length
    const el = mount(1500)
    await Promise.resolve()
    await Promise.resolve()
    vi.advanceTimersByTime(20)
    expect(qs.mock.calls.length).toBeGreaterThan(before)
    expect(observed).toContain(el)

    qs.mockRestore()
    span.remove()
    el.remove()
  })
  it('staggers by pre-skip index', () => {
    const els = [100, 1500, 1600, 1700].map(mount)
    render(<RevealObserver />)
    vi.advanceTimersByTime(60)
    // The in-view element consumed index 0, so the last one is index 3.
    expect(els[3].style.transition).toBe(revealTransition(3))
    els.forEach((el) => el.remove())
  })
})
