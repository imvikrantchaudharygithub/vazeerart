import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {ImageVM} from '@/lib/viewmodel/types'
import {SanityImage} from './SanityImage'

const jpg: ImageVM = {
  assetId: 'image-abc123-1400x900-jpg',
  url: 'https://cdn.sanity.io/images/iq6do512/production/abc123-1400x900.jpg',
  width: 1400, height: 900, extension: 'jpg', lqip: null, alt: 'A frame', hotspot: {x: 0.2, y: 0.4, width: 0.1, height: 0.1}, crop: null,
}

describe('SanityImage', () => {
  it('renders a cover image positioned by the hotspot', () => {
    render(<SanityImage image={jpg} sizes="100vw" />)
    const img = screen.getByRole('img', {name: 'A frame'}) as HTMLImageElement
    expect(img.style.objectFit).toBe('cover')
    expect(img.style.objectPosition).toBe('20.00% 40.00%')
    // The URL is shaped by the global loader in next.config.ts (not active under Vitest); the asset must still be the source.
    expect(img.getAttribute('src')).toContain('abc123-1400x900.jpg')
  })
  it('serves GIFs untransformed', () => {
    const gif = {...jpg, extension: 'gif', url: 'https://cdn.sanity.io/images/iq6do512/production/abc123-400x300.gif', assetId: 'image-abc123-400x300-gif'}
    render(<SanityImage image={gif} sizes="100vw" />)
    const img = screen.getByRole('img', {name: 'A frame'}) as HTMLImageElement
    expect(img.getAttribute('src')).toBe(gif.url)
  })
})
