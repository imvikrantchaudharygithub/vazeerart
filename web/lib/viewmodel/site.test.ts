import {describe, expect, it} from 'vitest'
import {toSiteSettingsVM} from './site'

const base = {
  brandWord: 'Vazeer', brandScript: 'art.', copyright: '©', socials: null, management: null, dm: null, phone: null, marqueeWords: null,
  pages: [{key: 'home', navLabel: 'Home', menuLabel: 'Home', preFooterScript: null, preFooterLabel: null}],
  leaderLeft: null, leaderRight: null, leaderSkip: null, menuScript: null, menuClose: null, menuSocialsLabel: null,
  menuPhoto: null, showIntro: null, showMarquee: null, showGrain: null, showRec: null, seo: null,
}

describe('toSiteSettingsVM', () => {
  it('throws when the document is missing', () => {
    expect(() => toSiteSettingsVM(null)).toThrow(/siteSettings/)
  })
  it('fills defaults and resolves page hrefs', () => {
    const vm = toSiteSettingsVM(base as any)
    expect(vm.pages[0].href).toBe('/')
    expect(vm.socials).toEqual([])
    expect(vm.showIntro).toBe(true)
    expect(vm.leaderSkip).toBe('Skip →')
    expect(vm.phone).toBeNull()
  })
  it('maps the optional phone contact and drops a blank one', () => {
    const phone = {label: 'call', handle: '+91 95208 87694', url: 'tel:+919520887694'}
    expect(toSiteSettingsVM({...base, phone} as any).phone).toEqual(phone)
    expect(toSiteSettingsVM({...base, phone: {label: null, handle: ' +91 95208 87694', url: 'tel:+919520887694'}} as any).phone).toEqual({label: 'call', handle: ' +91 95208 87694', url: 'tel:+919520887694'})
    expect(toSiteSettingsVM({...base, phone: {label: 'call', handle: '  ', url: 'tel:+919520887694'}} as any).phone).toBeNull()
    expect(toSiteSettingsVM({...base, phone: {label: 'call', handle: '+91', url: ''}} as any).phone).toBeNull()
  })
})
