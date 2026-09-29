import {describe, expect, it} from 'vitest'
import {toFramesVM, toHomeVM, toWorkVM, type FramesPageVM} from './pagesContent'
import {ContentMissingError} from './site'

const asset = (id: string) => ({_id: `image-${id}-10x10-jpg`, url: `https://cdn.sanity.io/images/iq6do512/production/${id}-10x10.jpg`, extension: 'jpg', width: 10, height: 10, lqip: null})
const img = (id: string) => ({alt: id, hotspot: null, crop: null, asset: asset(id)})

const home = (target: string | null) =>
  ({
    hero: null, intro: null, reels: null, currently: null, seo: null,
    explore: {headingBlock: null, cards: [{label: 'Card', sub: 'sub', target, image: null}]},
  }) as never

describe('toHomeVM', () => {
  it('routes an explore card by its page key', () => {
    expect(toHomeVM(home('about')).explore.cards[0].href).toBe('/about')
  })
  it('falls back to /work for unknown, prototype-inherited and null targets', () => {
    expect(toHomeVM(home('toString')).explore.cards[0].href).toBe('/work')
    expect(toHomeVM(home(null)).explore.cards[0].href).toBe('/work')
  })
})

describe('toWorkVM', () => {
  it('throws ContentMissingError naming the document when the page is not published', () => {
    expect(() => toWorkVM(null as never)).toThrow(ContentMissingError)
    expect(() => toWorkVM(null as never)).toThrow(/workPage/)
  })
})

describe('toFramesVM', () => {
  const page: FramesPageVM = {script: '', heading: 'Frames', linkLabel: '', linkUrl: '#', reelLabel: 'REEL LABEL', postLabel: 'POST LABEL', seo: {title: null, description: null, image: null}}
  const frame = (id: string, ratio: string | null, image: unknown = img(id)) => ({_id: id, image, ratio, instagramUrl: null})

  it('keeps a known ratio and labels 9/16 as a reel, everything else as a post', () => {
    const out = toFramesVM([frame('a', '16/9'), frame('b', '9/16')] as never, page)
    expect(out.map((f) => [f.id, f.ratio, f.label])).toEqual([['a', '16/9', 'POST LABEL'], ['b', '9/16', 'REEL LABEL']])
  })
  it('defaults an unknown ratio to 4/5', () => {
    expect(toFramesVM([frame('c', '3/2')] as never, page)[0].ratio).toBe('4/5')
  })
  it('drops a frame whose image has no asset', () => {
    const out = toFramesVM([frame('d', '1/1', {alt: 'x', hotspot: null, crop: null, asset: null}), frame('e', '1/1', null), frame('f', '1/1')] as never, page)
    expect(out.map((f) => f.id)).toEqual(['f'])
  })
})
