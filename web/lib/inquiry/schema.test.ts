// web/lib/inquiry/schema.test.ts
import {describe, expect, it} from 'vitest'
import {validateInquiry} from './schema'

const types = ['Music video', 'Commercial']
const good = {type: 'Music video', name: 'Asha', contact: 'asha@example.com', dates: 'Nov, Delhi', brief: 'A moody night shoot', website: ''}

describe('validateInquiry', () => {
  it('accepts a complete submission and trims strings', () => {
    const r = validateInquiry({...good, name: '  Asha '}, types)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.name).toBe('Asha')
  })
  it('rejects missing name and short contact with field errors', () => {
    const r = validateInquiry({...good, name: '', contact: 'ab'}, types)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['contact', 'name'])
  })
  it('rejects a type that is not in the CMS list', () => {
    const r = validateInquiry({...good, type: 'Wedding'}, types)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.type).toMatch(/choose/i)
  })
  it('rejects a brief over 4000 characters and non-object input', () => {
    expect(validateInquiry({...good, brief: 'x'.repeat(4001)}, types).ok).toBe(false)
    expect(validateInquiry(null, types).ok).toBe(false)
  })
})
