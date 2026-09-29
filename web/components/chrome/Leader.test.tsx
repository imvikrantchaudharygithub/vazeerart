// web/components/chrome/Leader.test.tsx
import {act, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {Leader} from './Leader'

describe('Leader', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    sessionStorage.clear()
    document.documentElement.dataset.leader = 'on'
  })
  afterEach(() => {
    vi.useRealTimers()
    delete document.documentElement.dataset.leader
  })

  it('counts 3 → 2 → 1, fades at 2100 ms and ends at 2700 ms, marking the session', () => {
    render(<Leader left="Vazeer Art" right="Showreel 2026" skip="Skip →" />)
    const overlay = screen.getByTestId('leader')
    expect(screen.getByText('3')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByText('2')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByText('1')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(700))
    expect(overlay.dataset.out).toBe('true')
    expect(document.documentElement.dataset.leader).toBe('out')
    act(() => vi.advanceTimersByTime(600))
    expect(screen.queryByTestId('leader')).toBeNull()
    expect(document.documentElement.dataset.leader).toBe('')
    expect(sessionStorage.getItem('vazeer-leader')).toBe('1')
  })

  it('skip ends it immediately', () => {
    render(<Leader left="a" right="b" skip="Skip →" />)
    act(() => screen.getByRole('button', {name: 'Skip →', hidden: true}).click())
    expect(screen.queryByTestId('leader')).toBeNull()
    expect(sessionStorage.getItem('vazeer-leader')).toBe('1')
  })

  it('does nothing when the boot script did not arm it', () => {
    document.documentElement.dataset.leader = ''
    render(<Leader left="a" right="b" skip="s" />)
    act(() => vi.advanceTimersByTime(3000))
    expect(document.documentElement.dataset.leader).toBe('')
    expect(sessionStorage.getItem('vazeer-leader')).toBeNull()
  })
})
