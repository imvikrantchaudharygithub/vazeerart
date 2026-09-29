import {describe, expect, it} from 'vitest'
import {revealTransition, shouldSkipReveal} from './reveal'

describe('revealTransition', () => {
  it('staggers by (i % 3) * 0.08s with the prototype easing', () => {
    expect(revealTransition(0)).toBe('opacity 1s cubic-bezier(.2,.8,.2,1) 0s, translate 1s cubic-bezier(.2,.8,.2,1) 0s')
    expect(revealTransition(4)).toBe('opacity 1s cubic-bezier(.2,.8,.2,1) 0.08s, translate 1s cubic-bezier(.2,.8,.2,1) 0.08s')
    expect(revealTransition(5)).toContain('0.16s')
  })
})

describe('shouldSkipReveal', () => {
  it('skips elements whose top is above 92% of the viewport height', () => {
    expect(shouldSkipReveal(800, 1000)).toBe(true)
    expect(shouldSkipReveal(920, 1000)).toBe(false)
  })
})
