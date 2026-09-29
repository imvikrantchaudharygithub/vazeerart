// studio/scripts/lib/buildDocuments.test.ts
import {describe, expect, it} from 'vitest'
import {buildDocuments, IMAGE_KEYS} from './buildDocuments'

const assetIdByKey = Object.fromEntries(IMAGE_KEYS.map((k) => [k, `image-${k}-1400x900-jpg`])) as Record<string, string>

describe('buildDocuments', () => {
  const docs = buildDocuments(assetIdByKey)
  const byId = (id: string) => docs.find((d) => d._id === id) as any

  it('creates six singletons with _id === _type, five projects and twelve frames', () => {
    for (const id of ['siteSettings', 'homePage', 'workPage', 'framesPage', 'aboutPage', 'contactPage']) {
      expect(byId(id)?._type).toBe(id)
    }
    expect(docs.filter((d) => d._type === 'project')).toHaveLength(5)
    expect(docs.filter((d) => d._type === 'frame')).toHaveLength(12)
  })

  it('is deterministic', () => {
    expect(buildDocuments(assetIdByKey)).toEqual(docs)
  })

  it('maps prototype image slots to the right asset', () => {
    expect(byId('homePage').hero.mainImage.asset._ref).toBe(assetIdByKey.A)
    expect(byId('project-pagal').cover.asset._ref).toBe(assetIdByKey.A)
    expect(byId('project-dehleez').cover.asset._ref).toBe(assetIdByKey.M)
    expect(byId('project-pagal').frameGrabs.map((g: any) => g.asset._ref)).toEqual(['C', 'E', 'F', 'G'].map((k) => assetIdByKey[k]))
    expect(byId('siteSettings').menuPhoto.asset._ref).toBe(assetIdByKey.C)
  })

  it('orders projects and frames with increasing orderRank', () => {
    const ranks = docs.filter((d) => d._type === 'project').map((d: any) => d.orderRank)
    expect([...ranks].sort()).toEqual(ranks)
    const frames = docs.filter((d) => d._type === 'frame') as any[]
    expect(frames.map((f) => f.ratio)).toEqual(['4/5', '9/16', '4/5', '1/1', '4/5', '9/16', '4/5', '4/5', '1/1', '9/16', '4/5', '4/5'])
  })

  it('copies prototype copy verbatim, including curly quotes', () => {
    expect(byId('homePage').intro.subline).toBe('(Shakir Ali, if we’re being formal)')
    expect(byId('siteSettings').marqueeWords).toEqual(['Films', 'Commercials', 'Music Videos', 'Colour', 'The Edit'])
    expect(byId('siteSettings').pages.map((p: any) => p.key)).toEqual(['home', 'about', 'work', 'frames', 'contact'])
  })
})
