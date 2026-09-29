import {render} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {MediaSlot} from './MediaSlot'

describe('MediaSlot', () => {
  it('renders a muted looping video for video media', () => {
    const {container} = render(<MediaSlot media={{kind: 'video', url: 'https://cdn.sanity.io/files/x/y/loop.mp4'}} sizes="30vw" />)
    const video = container.querySelector('video')!
    expect(video).toBeTruthy()
    expect(video.muted).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.getAttribute('playsinline')).not.toBeNull()
    expect(video.getAttribute('src')).toBe('https://cdn.sanity.io/files/x/y/loop.mp4')
  })
  it('renders nothing when media is null', () => {
    const {container} = render(<MediaSlot media={null} sizes="30vw" />)
    expect(container.innerHTML).toBe('')
  })
})
