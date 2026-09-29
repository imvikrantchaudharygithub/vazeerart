// web/lib/motion/leaderBoot.test.ts
import {describe, expect, it} from 'vitest'
import {leaderBootSource, leaderShouldRun} from './leaderBoot'

describe('leaderShouldRun', () => {
  it('runs only when enabled, unseen, and motion is allowed', () => {
    expect(leaderShouldRun({enabled: true, seen: false, reducedMotion: false})).toBe(true)
    expect(leaderShouldRun({enabled: false, seen: false, reducedMotion: false})).toBe(false)
    expect(leaderShouldRun({enabled: true, seen: true, reducedMotion: false})).toBe(false)
    expect(leaderShouldRun({enabled: true, seen: false, reducedMotion: true})).toBe(false)
  })
})

describe('leaderBootSource', () => {
  it('sets data-leader="on" synchronously when the leader should run', () => {
    const src = leaderBootSource(true)
    const html = {dataset: {} as Record<string, string>}
    const sessionStorage = {getItem: () => null}
    const matchMedia = () => ({matches: false})
    new Function('document', 'sessionStorage', 'matchMedia', src)({documentElement: html}, sessionStorage, matchMedia)
    expect(html.dataset.leader).toBe('on')
  })
  it('does nothing when seen or disabled', () => {
    const html = {dataset: {} as Record<string, string>}
    new Function('document', 'sessionStorage', 'matchMedia', leaderBootSource(true))({documentElement: html}, {getItem: () => '1'}, () => ({matches: false}))
    expect(html.dataset.leader).toBeUndefined()
    new Function('document', 'sessionStorage', 'matchMedia', leaderBootSource(false))({documentElement: html}, {getItem: () => null}, () => ({matches: false}))
    expect(html.dataset.leader).toBeUndefined()
  })
  it('does nothing under prefers-reduced-motion', () => {
    const html = {dataset: {} as Record<string, string>}
    new Function('document', 'sessionStorage', 'matchMedia', leaderBootSource(true))({documentElement: html}, {getItem: () => null}, () => ({matches: true}))
    expect(html.dataset.leader).toBeUndefined()
  })
})
