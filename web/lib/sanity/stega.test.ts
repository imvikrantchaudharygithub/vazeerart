import {stegaClean, stegaEncodeSourceMap, type ContentSourceMap} from '@sanity/client/stega'
import {describe, expect, it, vi} from 'vitest'
import {STEGA_EXCLUDED_KEYS, stegaFilter} from './stega'

const csm: ContentSourceMap = {
  documents: [
    {_id: 'project-1', _type: 'project'},
    {_id: 'image-abc123-1200x800-gif', _type: 'sanity.imageAsset'},
  ],
  paths: ["$['category']", "$['title']", "$['extension']"],
  mappings: {
    "$['category']": {source: {document: 0, path: 0, type: 'documentValue'}, type: 'value'},
    "$['title']": {source: {document: 0, path: 1, type: 'documentValue'}, type: 'value'},
    "$['cover']['asset']['extension']": {source: {document: 1, path: 2, type: 'documentValue'}, type: 'value'},
  },
}

const encode = <T,>(result: T) =>
  stegaEncodeSourceMap(result, csm, {enabled: true, studioUrl: 'https://vazeerart.sanity.studio', filter: stegaFilter})

describe('stegaFilter (real encoder)', () => {
  it('leaves value-compared enum and asset fields untouched', () => {
    const out = encode({category: 'editor', title: 'Pagal', cover: {asset: {extension: 'gif'}}})
    expect(out.category).toBe('editor')
    expect(out.cover.asset.extension).toBe('gif')
  })
  it('still encodes ordinary copy', () => {
    const out = encode({category: 'editor', title: 'Pagal', cover: {asset: {extension: 'gif'}}})
    expect(out.title).not.toBe('Pagal')
    expect(stegaClean(out.title)).toBe('Pagal')
  })
  it('lists every key the mappers compare by value', () => {
    expect([...STEGA_EXCLUDED_KEYS].sort()).toEqual(['category', 'extension', 'kind', 'ratio', 'target'])
  })
  it('delegates every other key to filterDefault', () => {
    const filterDefault = vi.fn(() => true)
    const props = {sourceDocument: {_id: 'project-1', _type: 'project'}, value: 'x', sourcePath: ['title'], resultPath: ['title'], filterDefault}
    expect(stegaFilter(props as never)).toBe(true)
    expect(filterDefault).toHaveBeenCalledWith(props)
  })
})
