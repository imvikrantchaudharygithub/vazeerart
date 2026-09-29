// web/components/motion/Timecode.test.tsx
import {render} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {Timecode} from './Timecode'

beforeEach(() => { vi.useFakeTimers({toFake: ['setInterval', 'clearInterval', 'performance']}) })
afterEach(() => { vi.useRealTimers() })

describe('Timecode', () => {
  it('ticks on a monotonic clock and rewrites the text node in place', () => {
    const span = document.createElement('span')
    span.setAttribute('data-tc', '')
    span.textContent = '00:00:00:00'
    document.body.appendChild(span)
    const textNode = span.firstChild

    const {unmount} = render(<Timecode />)
    vi.advanceTimersByTime(40)
    expect(span.textContent).toBe('00:00:00:01')
    expect(span.firstChild).toBe(textNode) // same node: characterData, not a childList mutation

    vi.advanceTimersByTime(40 * 24)
    expect(span.textContent).toBe('00:00:01:00')

    unmount()
    span.remove()
  })
})
