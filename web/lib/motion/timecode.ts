import {TIMECODE} from './constants'

const pad = (n: number) => String(n).padStart(2, '0')

/** Prototype: f = floor(elapsed/40); HH = f/90000 % 24, MM = f/1500 % 60, SS = f/25 % 60, FF = f % 25 */
export function formatTimecode(elapsedMs: number): string {
  const f = Math.floor(elapsedMs / TIMECODE.TICK_MS)
  const fps = TIMECODE.FPS
  return `${pad(Math.floor(f / (fps * 3600)) % 24)}:${pad(Math.floor(f / (fps * 60)) % 60)}:${pad(Math.floor(f / fps) % 60)}:${pad(f % fps)}`
}
