import {describe, expect, it} from 'vitest'
import {mediaSlot} from './mediaSlot'

describe('mediaSlot schema', () => {
  it('has kind, image and video fields with kind defaulting to image', () => {
    const names = mediaSlot.fields.map((f) => f.name)
    expect(names).toEqual(['kind', 'image', 'video'])
    const kind = mediaSlot.fields.find((f) => f.name === 'kind')!
    expect(kind.initialValue).toBe('image')
  })
})
