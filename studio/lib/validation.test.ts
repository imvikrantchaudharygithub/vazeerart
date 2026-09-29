import {describe, expect, it} from 'vitest'
import {isVideoUrl, validateMediaSlot} from './validation'

describe('isVideoUrl', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://vimeo.com/123456789',
    'https://player.vimeo.com/video/123456789',
    'https://vimeo.com/123456789/abcdef1234',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
  ])('accepts %s', (url) => {
    expect(isVideoUrl(url)).toBe(true)
  })

  it.each(['https://www.dailymotion.com/video/x7', 'not a url', 'https://youtube.com/', ''])(
    'rejects %s',
    (url) => {
      expect(isVideoUrl(url)).toBe(false)
    },
  )
})

describe('validateMediaSlot', () => {
  it('requires an image when kind is image', () => {
    expect(validateMediaSlot({kind: 'image'})).toBe('Choose an image')
    expect(validateMediaSlot({kind: 'image', image: {asset: {_ref: 'x'}}})).toBe(true)
  })
  it('requires a file when kind is video', () => {
    expect(validateMediaSlot({kind: 'video'})).toBe('Upload an MP4 or WebM loop')
    expect(validateMediaSlot({kind: 'video', video: {asset: {_ref: 'x'}}})).toBe(true)
  })
  it('passes when empty (field-level required handles that)', () => {
    expect(validateMediaSlot(undefined)).toBe(true)
  })
})
