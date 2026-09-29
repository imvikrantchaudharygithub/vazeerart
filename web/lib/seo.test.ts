import {stegaEncodeSourceMap, type ContentSourceMap} from '@sanity/client/stega'
import {describe, expect, it} from 'vitest'
import {buildMetadata, ogImageUrl} from './seo'

const img = {assetId: 'image-abc-1400x900-jpg', url: 'https://cdn.sanity.io/images/iq6do512/production/abc-1400x900.jpg', width: 1400, height: 900, extension: 'jpg', lqip: null, alt: 'Cover', hotspot: null, crop: null}
const fallback = {title: 'Vazeer Art — DOP', description: 'Default description', image: img}

describe('ogImageUrl', () => {
  it('requests a 1200×630 crop from the Sanity CDN', () => {
    const u = new URL(ogImageUrl(img))
    expect(u.searchParams.get('w')).toBe('1200')
    expect(u.searchParams.get('h')).toBe('630')
    expect(u.searchParams.get('fit')).toBe('crop')
  })
})

describe('buildMetadata', () => {
  it('prefers the page seo and falls back field by field', () => {
    const m = buildMetadata({seo: {title: 'Pagal', description: null, image: null}, fallback, path: '/work/pagal', siteUrl: 'https://vazeerart.com'})
    expect(m.title).toBe('Pagal')
    expect(m.description).toBe('Default description')
    expect(m.alternates?.canonical).toBe('https://vazeerart.com/work/pagal')
    expect((m.openGraph?.images as {url: string}[])[0].url).toContain('abc-1400x900.jpg')
  })
  it('uses an explicit title when the page has none', () => {
    const m = buildMetadata({seo: {title: null, description: null, image: null}, fallback, path: '/frames', siteUrl: 'https://vazeerart.com', title: 'Frames'})
    expect(m.title).toBe('Frames')
  })
  it('uses the page cover (imageFallback) before the site default image', () => {
    const cover = {...img, assetId: 'image-cov-1600x900-jpg', url: 'https://cdn.sanity.io/images/iq6do512/production/cov-1600x900.jpg'}
    const m = buildMetadata({seo: {title: null, description: null, image: null}, fallback, path: '/work/pagal', siteUrl: 'https://vazeerart.com', imageFallback: cover})
    const url = (m.openGraph?.images as {url: string}[])[0].url
    expect(url).toContain('cov-1600x900.jpg')
    expect(url).not.toContain('abc-1400x900.jpg')
  })
  it('prefers seo.image over the page cover and the site default', () => {
    const cover = {...img, assetId: 'image-cov-1600x900-jpg', url: 'https://cdn.sanity.io/images/iq6do512/production/cov-1600x900.jpg'}
    const own = {...img, assetId: 'image-own-1200x800-jpg', url: 'https://cdn.sanity.io/images/iq6do512/production/own-1200x800.jpg'}
    const m = buildMetadata({seo: {title: null, description: null, image: own}, fallback, path: '/work/pagal', siteUrl: 'https://vazeerart.com', imageFallback: cover})
    const url = (m.openGraph?.images as {url: string}[])[0].url
    expect(url).toContain('own-1200x800.jpg')
    expect(url).not.toContain('cov-1600x900.jpg')
    expect(url).not.toContain('abc-1400x900.jpg')
  })
  it('uses the large twitter card with an image and the plain one without', () => {
    const empty = {title: null, description: null, image: null}
    expect(buildMetadata({seo: empty, fallback, path: '/', siteUrl: 'https://x.com'}).twitter).toMatchObject({card: 'summary_large_image'})
    expect(buildMetadata({seo: empty, fallback: {...fallback, image: null}, path: '/', siteUrl: 'https://x.com'}).twitter).toMatchObject({card: 'summary'})
  })
  it('omits openGraph images when nothing is available', () => {
    const m = buildMetadata({seo: {title: null, description: null, image: null}, fallback: {...fallback, image: null}, path: '/', siteUrl: 'https://x.com'})
    expect(m.openGraph?.images).toBeUndefined()
  })
})

describe('buildMetadata in draft / Presentation mode (stega)', () => {
  const csm: ContentSourceMap = {
    documents: [{_id: 'siteSettings', _type: 'siteSettings'}],
    paths: ["$['title']", "$['description']", "$['alt']"],
    mappings: {
      "$['title']": {source: {document: 0, path: 0, type: 'documentValue'}, type: 'value'},
      "$['description']": {source: {document: 0, path: 1, type: 'documentValue'}, type: 'value'},
      "$['alt']": {source: {document: 0, path: 2, type: 'documentValue'}, type: 'value'},
    },
  }
  const encoded = stegaEncodeSourceMap({title: 'Pagal', description: 'A music video', alt: 'Cover frame'}, csm, {enabled: true, studioUrl: 'https://vazeerart.sanity.studio'})
  const hasInvisible = (s: unknown) => typeof s === 'string' && /[\u200b-\u200f\u2060\ufeff]/.test(s)

  it('fixture really is stega-encoded', () => {
    expect(encoded.title).not.toBe('Pagal')
    expect(encoded.description).not.toBe('A music video')
    expect(encoded.alt).not.toBe('Cover frame')
  })
  it('emits clean strings into <head>', () => {
    const m = buildMetadata({
      seo: {title: encoded.title, description: encoded.description, image: {...img, alt: encoded.alt}},
      fallback: {...fallback, title: encoded.title},
      path: '/work/pagal',
      siteUrl: 'https://vazeerart.com',
    })
    expect(m.title).toBe('Pagal')
    expect(m.description).toBe('A music video')
    expect(m.openGraph?.title).toBe('Pagal')
    expect(m.openGraph?.description).toBe('A music video')
    expect((m.openGraph as {siteName?: string}).siteName).toBe('Pagal')
    expect((m.openGraph?.images as {alt: string}[])[0].alt).toBe('Cover frame')
    expect(m.twitter?.title).toBe('Pagal')
    expect(hasInvisible(JSON.stringify(m))).toBe(false)
  })
  it('cleans an explicit title argument too', () => {
    const m = buildMetadata({seo: {title: null, description: null, image: null}, fallback, path: '/frames', siteUrl: 'https://vazeerart.com', title: encoded.title})
    expect(m.title).toBe('Pagal')
  })
})
