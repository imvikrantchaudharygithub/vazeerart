import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {FrameVM} from '@/lib/viewmodel/pagesContent'
import {FramesGrid} from './FramesGrid'

const image = {assetId: 'image-a-900x1125-jpg', url: 'https://cdn.sanity.io/images/p/d/a-900x1125.jpg', width: 900, height: 1125, extension: 'jpg', lqip: null, alt: 'Frame', hotspot: null, crop: null}
const page = {script: 'straight from the grid', heading: 'Frames', linkLabel: '(follow along ↗)', linkUrl: 'https://instagram.com/x', reelLabel: 'Reel cover', postLabel: 'Instagram post', seo: {title: null, description: null, image: null}}
const frames: FrameVM[] = [
  {id: '1', image, ratio: '9/16', instagramUrl: null, label: 'Reel cover'},
  {id: '2', image, ratio: '16/9', instagramUrl: 'https://instagram.com/p/1', label: 'Instagram post'},
]

describe('FramesGrid', () => {
  it('renders each frame with its aspect ratio, wrapping linked frames in an anchor', () => {
    render(<FramesGrid page={page} frames={frames} />)
    const items = screen.getAllByTestId('frame')
    expect(items.map((el) => el.getAttribute('data-ratio'))).toEqual(['9/16', '16/9'])
    expect(items[0].closest('a')).toBeNull()
    expect(items[1].closest('a')).toHaveAttribute('href', 'https://instagram.com/p/1')
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Frames')
    expect(screen.getByRole('link', {name: '(follow along ↗)'})).toHaveAttribute('href', 'https://instagram.com/x')
  })
})
