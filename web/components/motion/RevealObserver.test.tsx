// web/components/motion/RevealObserver.test.tsx
import {render} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {RevealObserver} from './RevealObserver'

vi.mock('next/navigation', () => ({usePathname: () => '/'}))

type Entry = {isIntersecting: boolean; target: Element}
let observed: Element[] = []
let trigger: (entries: Entry[]) => void = () => {}

beforeEach(() => {
  observed = []
  vi.useFakeTimers()
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: (e: Entry[]) => void) { trigger = cb }
    observe = (el: Element) => { observed.push(el) }
    unobserve = () => {}
    disconnect = () => {}
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
})
