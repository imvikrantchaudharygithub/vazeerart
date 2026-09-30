// web/lib/motion/lensSplit.test.ts
import {describe, expect, it} from 'vitest'
import {chunkWord, glidePlan, lensSplitFrame, lensSplitGeometry, progressFromScroll, seg, smoothToward} from './lensSplit'

// The export's own stage: 390 wide, fit window 684 du tall → u = 1, and its measured integer widths.
const EXPORT = {W: 390, Hs: 684, stageH: 748, widths: [234, 205, 222], artWidth: 88, aspect: 1.5, focus: {x: 0.5, y: 0.5}}
const g = lensSplitGeometry(EXPORT)

function expectClose(actual: Record<string, number>, expected: Record<string, number>) {
  for (const [k, v] of Object.entries(expected)) expect(actual[k], k).toBeCloseTo(v, 9)
}

describe('chunkWord', () => {
  // CSS uppercases the pieces, so these render as the export's VA / ZE / ER.
  it('splits the name like the export (Va / Ze / Er)', () => expect(chunkWord('Vazeer')).toEqual(['Va', 'ze', 'er']))
  it('splits other lengths into near-equal pieces and ignores spaces', () => {
    expect(chunkWord('Vazeers')).toEqual(['Vaz', 'ee', 'rs'])
    expect(chunkWord('Shakir Ali')).toEqual(['Sha', 'kir', 'Ali'])
    expect(chunkWord('Jo')).toEqual(['J', 'o'])
    expect(chunkWord('')).toEqual([])
  })
})

describe('lensSplitGeometry at the export size reproduces setup()', () => {
  it('uses u = 1 and the export width', () => { expect(g.u).toBe(1); expect(g.Wd).toBe(390); expect(g.offY).toBe(0) })
  it('stacks the pieces centred (B)', () => {
    expect(g.lensRows.map((r) => [r.x, r.y, r.s])).toEqual([[78, 130, 1], [92.5, 330, 1], [84, 530, 1]])
  })
  it('lines them up at 124 px (A)', () => {
    const xs = g.splitRow.map((r) => r.x)
    expect(xs[0]).toBeCloseTo(31.072, 3); expect(xs[1]).toBeCloseTo(147.136, 3); expect(xs[2]).toBeCloseTo(248.816, 3)
    for (const r of g.splitRow) { expect(r.y).toBe(583); expect(r.s).toBeCloseTo(0.496, 6) }
  })
  it('places "art" like artA / artB', () => {
    expect(g.artSplit.x).toBeCloseTo(299.057, 3); expect(g.artSplit.y).toBe(655); expect(g.artSplit.k).toBeCloseTo(0.725806, 5); expect(g.artSplit.r).toBe(-8)
    expect(g.artLens).toEqual({x: 274, y: 676, k: 1, r: -10})
  })
  it('has the lens at 37,250 316×316 and the thumb vector to its centre', () => {
    expect(g.lens).toEqual({x: 37, y: 250, w: 316, h: 316})
    expect(g.thumbVector).toEqual({x: 113, y: -77})
  })
})

describe('lensSplitFrame matches the export apply(t) (Appendix A of the measured choreography)', () => {
  it('t = 1 is the lens layout: identity transforms, full outlines, amber drained', () => {
    const f = lensSplitFrame(1, g)
    expect(f.words.every((w) => w.tx === 0 && w.ty === 0 && w.k === 1)).toBe(true)
    expect(f.photo.tx).toBeCloseTo(37, 6); expect(f.photo.ty).toBeCloseTo(250, 6)
    expect(f.photo.sx).toBeCloseTo(316 / 390, 6); expect(f.photo.sy).toBeCloseTo(316 / 480, 6)
    expect(f.photo.rx).toBeCloseTo(195, 6); expect(f.photo.ry).toBeCloseTo(240, 6)
    expect([f.amber, f.outline, f.grad]).toEqual([1, 1, 0])
    expect(f.wordColor).toBe('rgb(239,231,218)'); expect(f.artColor).toBe('rgb(232,162,74)')
    expectClose(f.thumb, {tx: 113, ty: -77, r: 10, k: 0.3, opacity: 0})
    expect(f.art).toEqual({tx: 0, ty: 0, r: -10, k: 1})
    expect(f.ring.shadow).toBe('0 0 0 10px #0f0d0b, 0 0 0 11px rgba(239,231,218,0.35), 0 30px 70px rgba(0,0,0,0.6)')
  })
  it('t = 0.5 matches the export mid-frame', () => {
    const f = lensSplitFrame(0.5, g)
    // photo 33.5,226.7,322.9,331.3 / radius 143.3
    expect(f.photo.tx).toBeCloseTo(33.5, 0); expect(f.photo.ty).toBeCloseTo(226.7, 1)
    expect(f.photo.sx * 390).toBeCloseTo(322.9, 1); expect(f.photo.sy * 480).toBeCloseTo(331.3, 1)
    expect(f.photo.rx * f.photo.sx).toBeCloseTo(143.3, 1)
    // amber top 790.1 of 480..844
    expect(480 + 364 * f.amber).toBeCloseTo(790.1, 1)
    // VA 68.7,219.3,.901 · ZE 114.7,432.8,.795 · ER 195.2,565.7,.66
    const pos = f.words.map((w, i) => [g.lensRows[i].x + w.tx, g.lensRows[i].y + w.ty, w.k])
    expect(pos[0][0]).toBeCloseTo(68.7, 1); expect(pos[0][1]).toBeCloseTo(219.3, 1); expect(pos[0][2]).toBeCloseTo(0.901, 3)
    expect(pos[1][0]).toBeCloseTo(114.7, 1); expect(pos[1][1]).toBeCloseTo(432.8, 1); expect(pos[1][2]).toBeCloseTo(0.795, 3)
    expect(pos[2][0]).toBeCloseTo(195.2, 1); expect(pos[2][1]).toBeCloseTo(565.7, 1); expect(pos[2][2]).toBeCloseTo(0.66, 2)
    expect(f.wordColor).toBe('rgb(229,222,209)'); expect(f.artColor).toBe('rgb(94,68,35)')
    expect(f.outline).toBe(0); expect(f.thumb.opacity).toBe(0)
    expect(274 + f.art.tx).toBeCloseTo(295.3, 1); expect(676 + f.art.ty).toBeCloseTo(658.1, 1); expect(f.art.r).toBeCloseTo(-8.3, 1); expect(f.art.k).toBeCloseTo(0.766, 3)
  })
  it('t = 0.25 matches the export late frame', () => {
    const f = lensSplitFrame(0.25, g)
    expect(f.photo.tx).toBeCloseTo(6.7, 1); expect(f.photo.ty).toBeCloseTo(45.6, 1)
    expect(f.photo.sx * 390).toBeCloseTo(376.5, 1); expect(f.photo.sy * 480).toBeCloseTo(450.1, 1)
    expect(Math.abs(480 + 364 * f.amber - 502.8)).toBeLessThanOrEqual(0.051) // table value is rounded to 0.1
    expect(g.lensRows[0].y + f.words[0].ty).toBeCloseTo(564.6, 1); expect(f.words[0].k).toBeCloseTo(0.517, 3)
    expect(f.wordColor).toBe('rgb(30,26,23)')
    expect(22 + 60 + f.thumb.tx - 60 - 22).toBeCloseTo(56.5, 1); expect(f.thumb.ty).toBeCloseTo(-38.5, 1)
    expect(f.thumb.r).toBeCloseTo(2, 0); expect(f.thumb.k).toBeCloseTo(0.65, 2); expect(f.thumb.opacity).toBeCloseTo(0.981, 3)
  })
  it('t = 0 is the split layout', () => {
    const f = lensSplitFrame(0, g)
    expect(f.words[0].tx).toBeCloseTo(-46.928, 3); expect(f.words[0].ty).toBe(453); expect(f.words[0].k).toBeCloseTo(0.496, 6)
    expectClose(f.photo, {tx: 0, ty: 0, sx: 1, sy: 1, rx: 0, ry: 0})
    expect(f.cover.kx).toBeCloseTo(1, 9); expect(f.cover.ky).toBeCloseTo(1, 9)
    expect([f.amber, f.outline, f.grad]).toEqual([0, 0, 1])
    expect(f.ring.shadow).toBe('none')
    expectClose(f.thumb, {tx: 0, ty: 0, r: -6, k: 1, opacity: 1})
    expect(f.art.tx).toBeCloseTo(25.057, 3); expect(f.art.ty).toBe(-21); expect(f.art.r).toBe(-8)
    expect(f.wordColor).toBe('rgb(20,17,14)'); expect(f.artColor).toBe('rgb(20,17,14)')
  })
  it('keeps the photo cover zoom uniform and equal to the export object-fit recrop (0.527× → 0.8× of 900×600)', () => {
    for (const t of [0, 0.3, 0.5, 0.7, 1]) {
      const f = lensSplitFrame(t, g)
      expect(f.cover.kx * f.photo.sx).toBeCloseTo(f.cover.ky * f.photo.sy, 9)
    }
    const lens = lensSplitFrame(1, g)
    expect(lens.cover.ky * lens.photo.sy * 480 * 1.5).toBeCloseTo(474, 6)
  })
})

describe('lensSplitGeometry on a height-bound phone (iPhone 13/14 Safari, 390 × 591 safe box)', () => {
  const p = lensSplitGeometry({...EXPORT, Hs: 591})
  it('fits the design rows 96..780 to the height', () => { expect(p.u).toBeCloseTo(591 / 684, 9); expect(p.Wd).toBeCloseTo(390 / p.u, 9) })
  it('keeps the split name at the export share of the width (84 %)', () => {
    const last = p.splitRow[2]
    expect((last.x + 222 * last.s - p.splitRow[0].x) / p.Wd).toBeCloseTo(327.856 / 390, 3)
  })
  it('keeps "art" glued to ER in the lens state', () => expect(p.artLens.x - p.lensRows[2].x).toBeCloseTo(274 - 84, 6))
})

describe('scroll helpers', () => {
  it('maps the runway to 0..1', () => {
    expect(progressFromScroll(-12, 300)).toBe(0); expect(progressFromScroll(150, 300)).toBe(0.5); expect(progressFromScroll(420, 300)).toBe(1)
  })
  it('smooths toward the target and snaps when close', () => {
    const a = smoothToward(0, 1, 16, 120)
    expect(a).toBeGreaterThan(0); expect(a).toBeLessThan(1)
    expect(smoothToward(0.99995, 1, 16, 120)).toBe(1)
  })
  it('glides to the end in the scroll direction at the export pace', () => {
    expect(glidePlan(0.3, 1, 2600)).toEqual({to: 1, durationMs: 0.7 * 2600})
    expect(glidePlan(0.3, -1, 2600)?.to).toBe(0)
    expect(glidePlan(0, 1, 2600)).toBeNull(); expect(glidePlan(1, -1, 2600)).toBeNull()
  })
  it('uses the export easeInOutCubic windows', () => { expect(seg(0.5, 0, 1)).toBe(0.5); expect(seg(0.2, 0.3, 0.9)).toBe(0) })
})
