import {describe, expect, it} from 'vitest'
import type {ImageVM} from '@/lib/viewmodel/types'
import {imageSrc, objectPositionFor, sanityImageLoader} from './image'

const base: ImageVM = {
  assetId: 'image-abc123-1400x900-jpg',
  url: 'https://cdn.sanity.io/images/iq6do512/production/abc123-1400x900.jpg',
  width: 1400, height: 900, extension: 'jpg', lqip: null, alt: 'x', hotspot: null, crop: null,
}

describe('imageSrc', () => {
  it('builds the CDN url from the asset id', () => {
    expect(imageSrc(base)).toBe('https://cdn.sanity.io/images/iq6do512/production/abc123-1400x900.jpg')
  })
  it('applies a crop rect when present', () => {
    const src = imageSrc({...base, crop: {top: 0.1, bottom: 0.1, left: 0, right: 0}})
    expect(src).toContain('rect=0,90,1400,720')
  })
})

describe('sanityImageLoader', () => {
  it('appends width, quality 65, auto format and fit max', () => {
    const out = sanityImageLoader({src: base.url, width: 800})
    const u = new URL(out)
    expect(u.searchParams.get('w')).toBe('800')
    expect(u.searchParams.get('q')).toBe('65')
    expect(u.searchParams.get('auto')).toBe('format')
    expect(u.searchParams.get('fit')).toBe('max')
  })
  it('keeps an existing rect and honours explicit quality', () => {
    const out = sanityImageLoader({src: base.url + '?rect=0,90,1400,720', width: 400, quality: 80})
    expect(out).toContain('rect=0%2C90%2C1400%2C720')
    expect(out).toContain('q=80')
  })
})

describe('objectPositionFor', () => {
  it('maps hotspot to percentages and defaults to center', () => {
    expect(objectPositionFor({x: 0.25, y: 0.75, width: 0.2, height: 0.2})).toBe('25.00% 75.00%')
    expect(objectPositionFor(null)).toBe('50% 50%')
  })
})
