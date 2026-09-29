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

  it('names a linked frame by its image alt, falling back to the post label when the alt is empty', () => {
    const linked = (id: string, alt: string): FrameVM => ({id, image: {...image, alt}, ratio: '16/9', instagramUrl: `https://instagram.com/p/${id}`, label: page.postLabel})
    render(<FramesGrid page={page} frames={[linked('a', ''), linked('b', 'Riverbank')]} />)
    const fallback = screen.getByRole('link', {name: page.postLabel})
    expect(fallback).toHaveAttribute('href', 'https://instagram.com/p/a')
    const named = screen.getByRole('link', {name: 'Riverbank'})
    expect(named).toHaveAttribute('href', 'https://instagram.com/p/b')
    expect(fallback).not.toHaveAttribute('aria-label')
    expect(named).not.toHaveAttribute('aria-label')
  })

  it('falls back to the reel label for a 9/16 frame with no alt', () => {
    const reel: FrameVM = {id: 'r', image: {...image, alt: ''}, ratio: '9/16', instagramUrl: null, label: page.reelLabel}
    render(<FramesGrid page={page} frames={[reel]} />)
    expect(screen.getByRole('img', {name: page.reelLabel})).toBeInTheDocument()
  })

  it('opens frame links in a new tab without a referrer, and marks every tile for the reveal', () => {
    render(<FramesGrid page={page} frames={frames} />)
    const tiles = screen.getAllByTestId('frame')
    expect(tiles).toHaveLength(2)
    for (const tile of tiles) expect(tile).toHaveAttribute('data-reveal', '1')
    const anchor = tiles[1].closest('a')
    expect(anchor).toHaveAttribute('target', '_blank')
    expect(anchor).toHaveAttribute('rel', 'noreferrer')
  })

  it('sizes frame images to a 340px column on wide screens', () => {
    render(<FramesGrid page={page} frames={frames} />)
    for (const tile of screen.getAllByTestId('frame')) {
      expect(tile.querySelector('img')).toHaveAttribute('sizes', '(max-width: 600px) 100vw, 340px')
    }
  })
})
