import {describe, expect, it} from 'vitest'
import {documentTypes} from '../index'

const byName = (name: string) => documentTypes.find((t) => t.name === name) as any
const fieldNames = (name: string) => byName(name).fields.map((f: any) => f.name)

describe('collections', () => {
  it('project has the spec fields including orderRank', () => {
    expect(fieldNames('project')).toEqual([
      'orderRank', 'title', 'slug', 'format', 'year', 'role', 'category', 'cover', 'frameGrabs', 'videoUrl', 'showOnHome', 'creditOnly', 'seo',
    ])
  })
  it('frame has image, ratio, instagramUrl and orderRank', () => {
    expect(fieldNames('frame')).toEqual(['orderRank', 'image', 'ratio', 'instagramUrl'])
  })
  it('inquiry fields are read-only except read', () => {
    const fields = byName('inquiry').fields as any[]
    for (const f of fields) {
      if (f.name === 'read') expect(f.readOnly).toBeFalsy()
      else expect(f.readOnly, f.name).toBe(true)
    }
  })
})
