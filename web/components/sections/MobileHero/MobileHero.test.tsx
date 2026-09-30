// web/components/sections/MobileHero/MobileHero.test.tsx
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {render} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {MOBILE_HERO} from '@/lib/motion/constants'
import {MobileHero, effectiveAspect} from './MobileHero'

vi.mock('./LensSplitController', () => ({LensSplitController: () => null}))

const image = {assetId: 'image-a-1400x933-jpg', url: 'https://cdn.sanity.io/images/p/d/a-1400x933.jpg', width: 1400, height: 933, extension: 'jpg', lqip: null, alt: 'Operator', hotspot: null, crop: null}
const hero = {word: 'Vazeer', script: 'art', image, thumb: {kind: 'image' as const, image: {...image, alt: 'Rig'}}, wordPath: 'hero.word' as const}

describe('MobileHero', () => {
  it('draws the lens state: the name in three pieces, filled and outlined, hidden from screen readers', () => {
    const {container} = render(<MobileHero hero={hero} />)
    const fill = [0, 1, 2].map((i) => container.querySelector(`[data-lens="w${i}"]`)?.textContent)
    const outline = [0, 1, 2].map((i) => container.querySelector(`[data-lens="o${i}"]`)?.textContent)
    expect(fill).toEqual(['Va', 'ze', 'er'])
    expect(outline).toEqual(['Va', 'ze', 'er'])
    for (const el of container.querySelectorAll('[data-lens^="w"], [data-lens^="o"], [data-lens="art"]')) {
      expect(el.closest('[aria-hidden="true"]')).not.toBeNull()
    }
    expect(container.querySelector('[data-lens="art"]')?.textContent).toBe('art')
  })
  it('renders every part the controller drives, in the export paint order', () => {
    const {container} = render(<MobileHero hero={hero} />)
    const order = [...container.querySelectorAll('[data-lens]')].map((e) => e.getAttribute('data-lens'))
    const idx = (k: string) => order.indexOf(k)
    for (const k of ['stage', 'safe', 'amber', 'ring', 'photo', 'cover', 'grad', 'thumb', 'art']) expect(order).toContain(k)
    expect(idx('amber')).toBeLessThan(idx('w0'))
    expect(idx('w2')).toBeLessThan(idx('ring'))
    expect(idx('ring')).toBeLessThan(idx('photo'))
    expect(idx('photo')).toBeLessThan(idx('thumb'))
    expect(idx('thumb')).toBeLessThan(idx('o0'))
    expect(idx('o2')).toBeLessThan(idx('art'))
  })
  it('marks only the entrance wrappers for the leader gate, never the parts the morph styles', () => {
    const {container} = render(<MobileHero hero={hero} />)
    for (const el of container.querySelectorAll('[data-hero-anim]')) expect(el.hasAttribute('data-lens')).toBe(false)
  })
  it('keeps the photo alt text', () => {
    const {getByAltText} = render(<MobileHero hero={hero} />)
    expect(getByAltText('Operator')).toBeInTheDocument()
  })
  it('works out the served aspect after the editor crop', () => {
    expect(effectiveAspect(image)).toBeCloseTo(1400 / 933, 6)
    expect(effectiveAspect({...image, crop: {top: 0, bottom: 0, left: 0.25, right: 0.25}})).toBeCloseTo(700 / 933, 6)
  })
})

describe('MOBILE_HERO.QUERY is the one phone breakpoint', () => {
  const WEB = join(__dirname, '..', '..', '..')
  it.each(['components/sections/MobileHero/MobileHero.module.css', 'app/page.module.css'])('%s uses the same literal', (file) => {
    expect(readFileSync(join(WEB, file), 'utf8')).toContain(`@media ${MOBILE_HERO.QUERY}`)
  })
})
