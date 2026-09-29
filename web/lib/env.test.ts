// web/lib/env.test.ts
import {afterEach, describe, expect, it, vi} from 'vitest'
import {readEnv} from './env'

describe('readEnv', () => {
  it('reads public values with defaults', () => {
    const env = readEnv({NEXT_PUBLIC_SANITY_PROJECT_ID: 'iq6do512', NEXT_PUBLIC_SANITY_DATASET: 'production'})
    expect(env.projectId).toBe('iq6do512')
    expect(env.dataset).toBe('production')
    expect(env.apiVersion).toBe('2026-09-29')
    expect(env.studioUrl).toBe('http://localhost:3333')
    expect(env.siteUrl).toBe('http://localhost:3000')
  })
  it('throws when the project id is missing', () => {
    expect(() => readEnv({})).toThrow(/NEXT_PUBLIC_SANITY_PROJECT_ID/)
  })
})

describe('readEnv site url guard', () => {
  const required = {NEXT_PUBLIC_SANITY_PROJECT_ID: 'iq6do512', NEXT_PUBLIC_SANITY_DATASET: 'production'}
  afterEach(() => vi.restoreAllMocks())

  it('warns once, without throwing, when NEXT_PUBLIC_SITE_URL is unset in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const env = readEnv({...required, NODE_ENV: 'production'})
    expect(env.siteUrl).toBe('http://localhost:3000')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toMatch(/NEXT_PUBLIC_SITE_URL/)
  })
  it('does not warn in production when NEXT_PUBLIC_SITE_URL is set', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    readEnv({...required, NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://vazeerart.com'})
    expect(warn).not.toHaveBeenCalled()
  })
  it('never warns outside production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    readEnv({...required, NODE_ENV: 'development'})
    readEnv({...required, NODE_ENV: 'test'})
    readEnv(required)
    expect(warn).not.toHaveBeenCalled()
  })
})
