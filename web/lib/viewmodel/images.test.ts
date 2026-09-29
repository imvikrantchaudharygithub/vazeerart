import {describe, expect, it} from 'vitest'
import {toImageVM, toMediaVM} from './images'

const asset = {_id: 'image-abc-1400x900-jpg', url: 'https://cdn.sanity.io/images/p/d/abc-1400x900.jpg', extension: 'jpg', width: 1400, height: 900, lqip: 'data:image/jpeg;base64,xx'}

describe('toImageVM', () => {
  it('flattens the projection', () => {
    const vm = toImageVM({alt: 'A', hotspot: {x: 0.5, y: 0.5, width: 1, height: 1, _type: 'sanity.imageHotspot'}, crop: null, asset})
    expect(vm).toEqual({assetId: asset._id, url: asset.url, width: 1400, height: 900, extension: 'jpg', lqip: asset.lqip, alt: 'A', hotspot: {x: 0.5, y: 0.5, width: 1, height: 1}, crop: null})
  })
  it('returns null without an asset and tolerates missing metadata', () => {
    expect(toImageVM(null)).toBeNull()
    expect(toImageVM({alt: 'A', hotspot: null, crop: null, asset: null})).toBeNull()
    const vm = toImageVM({alt: null, hotspot: null, crop: null, asset: {...asset, width: null, height: null, lqip: null}})
    expect(vm?.width).toBe(0)
    expect(vm?.alt).toBe('')
  })
})

describe('toMediaVM', () => {
  it('maps video and image kinds, null when incomplete', () => {
    expect(toMediaVM({kind: 'video', image: null, videoUrl: 'https://cdn.sanity.io/files/p/d/x.mp4'})).toEqual({kind: 'video', url: 'https://cdn.sanity.io/files/p/d/x.mp4'})
    expect(toMediaVM({kind: 'image', image: {alt: 'A', hotspot: null, crop: null, asset}, videoUrl: null})?.kind).toBe('image')
    expect(toMediaVM({kind: 'video', image: null, videoUrl: null})).toBeNull()
    expect(toMediaVM(null)).toBeNull()
  })
})
