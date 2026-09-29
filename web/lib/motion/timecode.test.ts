import {describe, expect, it} from 'vitest'
import {formatTimecode} from './timecode'

describe('formatTimecode (25 fps, 40 ms ticks — prototype)', () => {
  it('starts at zero', () => expect(formatTimecode(0)).toBe('00:00:00:00'))
  it('counts frames', () => expect(formatTimecode(40 * 7)).toBe('00:00:00:07'))
  it('rolls frames into seconds at 25', () => expect(formatTimecode(40 * 25)).toBe('00:00:01:00'))
  it('rolls minutes and hours', () => {
    expect(formatTimecode(60_000)).toBe('00:01:00:00')
    expect(formatTimecode(3_600_000 + 61_000 + 40 * 3)).toBe('01:01:01:03')
  })
  it('wraps hours at 24', () => expect(formatTimecode(24 * 3_600_000)).toBe('00:00:00:00'))
})
