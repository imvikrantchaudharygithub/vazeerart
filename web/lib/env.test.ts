// web/lib/env.test.ts
import {describe, expect, it} from 'vitest'
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
