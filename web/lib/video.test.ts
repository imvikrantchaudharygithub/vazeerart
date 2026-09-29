// web/lib/video.test.ts
import {describe, expect, it} from 'vitest'
import {parseVideoUrl} from './video'

describe('parseVideoUrl', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=10', 'youtube', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'youtube', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ'],
    ['https://vimeo.com/123456789', 'vimeo', '123456789'],
    ['https://player.vimeo.com/video/123456789?h=abc', 'vimeo', '123456789'],
  ])('parses %s', (url, provider, id) => {
    expect(parseVideoUrl(url)).toMatchObject({provider, id})
  })

  it('builds privacy-enhanced autoplay embed urls', () => {
    expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ')?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1')
    expect(parseVideoUrl('https://vimeo.com/123456789')?.embedUrl).toBe('https://player.vimeo.com/video/123456789?autoplay=1')
  })

  it.each(['', null, undefined, 'https://www.dailymotion.com/video/x7', 'https://youtube.com/', 'not a url'])('rejects %s', (url) => {
    expect(parseVideoUrl(url as string)).toBeNull()
  })
})
