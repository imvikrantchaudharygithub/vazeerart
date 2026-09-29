import {describe, expect, it, vi} from 'vitest'
import {stegaFilter} from './stega'

const base = {
  sourceDocument: {_id: 'project-1', _type: 'project'},
  value: 'editor',
}

describe('stegaFilter', () => {
  it('never encodes enum keys compared by the mappers', () => {
    for (const key of ['category', 'ratio', 'kind', 'target']) {
      const filterDefault = vi.fn(() => true)
      const ok = stegaFilter({...base, sourcePath: ['skills', 'items', {_key: 'a', _index: 0}, key], resultPath: [key], filterDefault} as never)
      expect(ok).toBe(false)
      expect(filterDefault).not.toHaveBeenCalled()
    }
  })
  it('delegates every other key to filterDefault', () => {
    const filterDefault = vi.fn(() => true)
    const props = {...base, sourcePath: ['title'], resultPath: ['title'], filterDefault}
    expect(stegaFilter(props as never)).toBe(true)
    expect(filterDefault).toHaveBeenCalledWith(props)
  })
})
