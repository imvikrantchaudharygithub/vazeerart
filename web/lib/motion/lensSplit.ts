// web/lib/motion/lensSplit.ts
// The export's setup()/apply(t) for variant 3a (design-reference/mobile-hero/design-source.jsx), re-evaluated for
// any phone: everything is computed in design units (du) and scaled by u px/du. Pure functions, no DOM.
import {MOBILE_HERO} from './constants'

type Rgb = readonly [number, number, number]
export type Rect = {x: number; y: number; w: number; h: number}
export type Placement = {x: number; y: number; s: number}
export type ArtPlacement = {x: number; y: number; k: number; r: number}

/** easeInOutCubic — the export's ease(). */
export function ease(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
/** The export's seg(a, b) for a given t. */
export function seg(t: number, a: number, b: number): number {
  return ease(Math.min(1, Math.max(0, (t - a) / (b - a))))
}
const lerp = (a: number, b: number, p: number) => a + (b - a) * p
export function mixRgb(c1: Rgb, c2: Rgb, p: number): string {
  return `rgb(${c1.map((v, i) => Math.round(lerp(v, c2[i], p))).join(',')})`
}

/** Lens font scale that keeps the widest piece about as wide as the export's two-letter pieces. */
export function lensFontScale(pieces: string[]): number {
  const longest = Math.max(0, ...pieces.map((p) => Array.from(p).length))
  return longest > 2 ? 2 / longest : 1
}

/** "Vazeer" → ["Va", "Ze", "Er"]: three near-equal pieces (fewer for words shorter than three letters). */
export function chunkWord(word: string): string[] {
  const chars = Array.from(word.replace(/\s+/g, ''))
  const n = chars.length
  const a = Math.ceil(n / 3)
  const b = Math.ceil((n - a) / 2)
  return [chars.slice(0, a), chars.slice(a, a + b), chars.slice(a + b)].map((c) => c.join('')).filter(Boolean)
}

export type GeometryInput = {
  /** Safe box (small viewport minus header) in px. */
  W: number
  Hs: number
  /** Stage height in px (large viewport minus header): the amber drains to its bottom. */
  stageH: number
  /** Piece widths in du at the lens font size (250 du), and "art" at 124 du. */
  widths: number[]
  artWidth: number
  /** Photo aspect (width / height) after the editor's crop, and its focus point (object-position fractions). */
  aspect: number
  focus: {x: number; y: number}
  /** Lens font as a fraction of the export's 250 du (below 1 only for names longer than six letters). */
  lensScale?: number
}

export type Geometry = {
  u: number
  Wd: number
  offY: number
  lensRows: Placement[]
  splitRow: Placement[]
  artLens: ArtPlacement
  artSplit: ArtPlacement
  /** Laid-out photo box (du): the export's 390 × 480 split box, centred. */
  photoBox: Rect
  split: Rect
  lens: Rect
  /** Photo cover inside the photo box at t = 0 (du, box-local). */
  cover: Rect
  thumbVector: {x: number; y: number}
}

const LENS_D = 316
const SPLIT_H = 480

export function coverRect(boxW: number, boxH: number, aspect: number, focus: {x: number; y: number}): Rect {
  const w = aspect >= boxW / boxH ? boxH * aspect : boxW
  const h = aspect >= boxW / boxH ? boxH : boxW / aspect
  return {x: (boxW - w) * focus.x, y: (boxH - h) * focus.y, w, h}
}

export function lensSplitGeometry(i: GeometryInput): Geometry {
  const {Y0, Y1} = MOBILE_HERO
  const span = Y1 - Y0
  const u = Math.min(i.W / 390, i.Hs / span)
  const Wd = i.W / u
  const offY = Math.max(0, (i.Hs - span * u) / 2)
  const sum = i.widths.reduce((a, b) => a + b, 0)

  // Split lockup (row + "art") scales with the screen width so the name keeps the export's 84 % of it,
  // capped so the lowest split ink stays 16 du inside Y1 (export: "art" ink ends 129.25 du below the row top).
  const f = Math.min(Wd / 390, (Y1 - 16 - 583) / 129.25)
  let s = (124 / 250) * f / (i.lensScale ?? 1)
  if (sum * s > Wd - 48 * f) s = (Wd - 48 * f) / sum
  const rowW = sum * s
  const x0 = (Wd - rowW) / 2
  let cx = x0
  const splitRow = i.widths.map((w) => { const p = {x: cx, y: 583, s}; cx += w * s; return p })
  const lensRows = i.widths.map((w, n) => ({x: (Wd - w) / 2, y: 130 + n * 200, s: 1}))
  const ka = (90 / 124) * f
  const artSplit = {x: x0 + rowW - i.artWidth * ka + 4 * f, y: 583 + 72 * f, k: ka, r: -8}
  // Glued to ER as in the export's 2c lockup (274 at 390 wide), not to the screen edge.
  const artLens = {x: Wd / 2 + 79, y: 676, k: 1, r: -10}

  const duTop = Y0 - offY / u
  const splitTop = Math.min(0, duTop)
  const photoBox = {x: (Wd - 390) / 2, y: 0, w: 390, h: SPLIT_H}
  return {
    u, Wd, offY, lensRows, splitRow, artLens, artSplit, photoBox,
    split: {x: 0, y: splitTop, w: Wd, h: SPLIT_H - splitTop},
    lens: {x: (Wd - LENS_D) / 2, y: 250, w: LENS_D, h: LENS_D},
    cover: coverRect(390, SPLIT_H, i.aspect, i.focus),
    thumbVector: {x: Wd / 2 - 82, y: 408 - 485},
  }
}

export type Frame = {
  /** Photo box: translate (px), scale, local border radii (px). */
  photo: {tx: number; ty: number; sx: number; sy: number; rx: number; ry: number}
  /** Cover wrapper inside the photo box: scale about the focus point. */
  cover: {kx: number; ky: number}
  /** Lens bezel: translate (px) and scale from the lens box, and its box-shadow. */
  ring: {tx: number; ty: number; sx: number; sy: number; shadow: string}
  grad: number
  /** Amber block: translateY as a fraction of its own height (0 = risen, 1 = drained). */
  amber: number
  /** Pieces: translate (px) and scale from their lens position. */
  words: {tx: number; ty: number; k: number}[]
  wordColor: string
  outline: number
  art: {tx: number; ty: number; r: number; k: number}
  artColor: string
  thumb: {tx: number; ty: number; r: number; k: number; opacity: number}
}

/** The export's apply(t) (t = 1 lens, 0 split), expressed as transforms from the lens layout. */
export function lensSplitFrame(t: number, g: Geometry): Frame {
  const {INK, CREAM, AMBER} = MOBILE_HERO
  const u = g.u
  const ph = seg(t, 0, 0.7)
  const ring = seg(t, 0.55, 0.9)
  const rect = {
    x: lerp(g.split.x, g.lens.x, ph), y: lerp(g.split.y, g.lens.y, ph),
    w: lerp(g.split.w, g.lens.w, ph), h: lerp(g.split.h, g.lens.h, ph),
  }
  const radius = 158 * ph
  const sx = rect.w / g.photoBox.w
  const sy = rect.h / g.photoBox.h
  const coverH = rect.w / rect.h > g.cover.w / g.cover.h ? rect.w * (g.cover.h / g.cover.w) : rect.h
  const z = coverH / g.cover.h
  const gap = 10 * ring * u
  const hair = gap + Math.max(1, u) * ring
  const shadow = ring > 0
    ? `0 0 0 ${gap}px #0f0d0b, 0 0 0 ${hair}px rgba(239,231,218,${0.35 * ring}), 0 ${30 * u}px ${70 * u}px rgba(0,0,0,${0.6 * ring})`
    : 'none'
  const words = g.lensRows.map((b, i) => {
    const a = g.splitRow[i]
    const p = seg(t, 0.12 + i * 0.06, 0.72 + i * 0.06)
    return {tx: (lerp(a.x, b.x, p) - b.x) * u, ty: (lerp(a.y, b.y, p) - b.y) * u, k: lerp(a.s, b.s, p)}
  })
  const pa = seg(t, 0.3, 0.9)
  const A = g.artSplit, B = g.artLens
  const pt = seg(t, 0, 0.5)
  return {
    photo: {tx: (rect.x - g.photoBox.x) * u, ty: (rect.y - g.photoBox.y) * u, sx, sy, rx: (radius / sx) * u, ry: (radius / sy) * u},
    cover: {kx: z / sx, ky: z / sy},
    ring: {tx: (rect.x - g.lens.x) * u, ty: (rect.y - g.lens.y) * u, sx: rect.w / g.lens.w, sy: rect.h / g.lens.h, shadow},
    grad: 1 - ph,
    amber: seg(t, 0.1, 0.7),
    words,
    wordColor: mixRgb(INK, CREAM, seg(t, 0.15, 0.6)),
    outline: seg(t, 0.78, 1),
    art: {tx: (lerp(A.x, B.x, pa) - B.x) * u, ty: (lerp(A.y, B.y, pa) - B.y) * u, r: lerp(A.r, B.r, pa), k: lerp(A.k, B.k, pa)},
    artColor: mixRgb(INK, AMBER, seg(t, 0.3, 0.75)),
    thumb: {tx: g.thumbVector.x * pt * u, ty: g.thumbVector.y * pt * u, r: lerp(-6, 10, pt), k: lerp(1, 0.3, pt), opacity: 1 - seg(t, 0.2, 0.5)},
  }
}

/** Morph progress (0 lens → 1 split) from how far the runway has scrolled under the header. */
export function progressFromScroll(scrolledPx: number, morphPx: number): number {
  return morphPx > 0 ? Math.min(1, Math.max(0, scrolledPx / morphPx)) : 0
}

/** Frame-rate-independent exponential approach toward the target. */
export function smoothToward(current: number, target: number, dtMs: number, tauMs: number): number {
  const next = target + (current - target) * Math.exp(-Math.max(0, dtMs) / tauMs)
  return Math.abs(next - target) < 1e-4 ? target : next
}

/** Where a glide goes when scrolling stops part-way, and how long it takes at the export's pace. */
export function glidePlan(p: number, direction: number, fullMs: number): {to: 0 | 1; durationMs: number} | null {
  if (p <= 0 || p >= 1) return null
  const to = direction < 0 ? 0 : 1
  return {to, durationMs: Math.abs(to - p) * fullMs}
}
