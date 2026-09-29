import {describe, expect, it} from 'vitest'
import {toSiteSettingsVM} from './site'

describe('toSiteSettingsVM', () => {
  it('throws when the document is missing', () => {
    expect(() => toSiteSettingsVM(null)).toThrow(/siteSettings/)
  })
  it('fills defaults and resolves page hrefs', () => {
    const vm = toSiteSettingsVM({
      brandWord: 'Vazeer', brandScript: 'art.', copyright: '©', socials: null, management: null, dm: null, marqueeWords: null,
      pages: [{key: 'home', navLabel: 'Home', menuLabel: 'Home', preFooterScript: null, preFooterLabel: null}],
      leaderLeft: null, leaderRight: null, leaderSkip: null, menuScript: null, menuClose: null, menuSocialsLabel: null,
      menuPhoto: null, showIntro: null, showMarquee: null, showGrain: null, showRec: null, seo: null,
    } as any)
    expect(vm.pages[0].href).toBe('/')
    expect(vm.socials).toEqual([])
    expect(vm.showIntro).toBe(true)
    expect(vm.leaderSkip).toBe('Skip →')
  })
})
