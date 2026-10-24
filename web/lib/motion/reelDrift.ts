// web/lib/motion/reelDrift.ts
import {REEL_DRIFT} from './constants'

/** A frame delta the rail may move by: never negative, never longer than MAX_DT_MS (background tab, long task). */
export const clampDt = (dtMs: number) => Math.min(Math.max(dtMs, 0), REEL_DRIFT.MAX_DT_MS)

/** Any scroll offset folded onto the first card set: the clone set shows the same pixels at `pos - setWidth`. */
export function normalize(pos: number, setWidth: number): number {
  if (!(setWidth > 0)) return 0
  const r = pos % setWidth
  return r < 0 ? r + setWidth : r
}

/** Offset after one frame at `speed`, wrapped on the set pitch so the loop is seamless. */
export function advance(pos: number, dtMs: number, setWidth: number, speed: number = REEL_DRIFT.SPEED_PX_S): number {
  return normalize(pos + (speed * clampDt(dtMs)) / 1000, setWidth)
}

/**
 * Drift only when every offset of one set is reachable, i.e. the rail (both sets laid out) scrolls by at least a
 * set's pitch. That also means a single set overflows the rail; a rail that fits stays a plain row.
 */
export const needsDrift = (setWidth: number, scrollRange: number) => setWidth > 0 && scrollRange >= setWidth

/** A scroll event is the visitor's when the rail is not where our last write left it. */
export const isUserScroll = (actual: number, expected: number) => Math.abs(actual - expected) > REEL_DRIFT.OWN_SCROLL_TOLERANCE_PX

export type DriftState = {visible: boolean; hovered: boolean; focused: boolean; now: number; lastUserScroll: number}

/** The rail glides only on screen, with no pointer or focus on it, and RESUME_MS after the visitor last scrolled it. */
export const canMove = (s: DriftState) => s.visible && !s.hovered && !s.focused && s.now - s.lastUserScroll >= REEL_DRIFT.RESUME_MS
