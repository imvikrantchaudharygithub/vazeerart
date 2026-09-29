// web/components/motion/ParallaxLoop.test.tsx
import {render} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {ParallaxLoop} from './ParallaxLoop'

afterEach(() => vi.unstubAllGlobals())

describe('ParallaxLoop', () => {
  it('does not start when the user prefers reduced motion', () => {
    const raf = vi.fn()
    vi.stubGlobal('requestAnimationFrame', raf)
    vi.stubGlobal('matchMedia', () => ({matches: true}))
    render(<ParallaxLoop />)
    expect(raf).not.toHaveBeenCalled()
  })
  it('writes translate3d transforms to [data-depth] elements', () => {
    let frame: FrameRequestCallback = () => {}
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frame = cb; return 1 })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    vi.stubGlobal('matchMedia', () => ({matches: false}))
    const el = document.createElement('div')
    el.dataset.depth = '2'
    el.dataset.scroll = '-0.45'
    document.body.appendChild(el)
    render(<ParallaxLoop />)
    frame(0)
    expect(el.style.transform).toBe('translate3d(0.00px,0.00px,0)')
    el.remove()
  })
})
