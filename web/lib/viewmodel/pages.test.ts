import {describe, expect, it} from 'vitest'
import type {PageEntryVM} from './site'
import {activePageKey, navEntries, preFooterEntries} from './pages'

const pages: PageEntryVM[] = [
  {key: 'home', href: '/', navLabel: 'Home', menuLabel: 'Home', preFooterScript: '', preFooterLabel: ''},
  {key: 'about', href: '/about', navLabel: 'About', menuLabel: 'About', preFooterScript: 'learn more', preFooterLabel: 'About me'},
  {key: 'work', href: '/work', navLabel: 'Work & Reels', menuLabel: 'Work & Reels', preFooterScript: 'watch the', preFooterLabel: 'Reels'},
  {key: 'frames', href: '/frames', navLabel: 'Frames', menuLabel: 'Frames', preFooterScript: 'browse the', preFooterLabel: 'Frames'},
  {key: 'contact', href: '/contact', navLabel: 'Contact', menuLabel: 'Contact', preFooterScript: 'get in', preFooterLabel: 'Touch'},
]

describe('activePageKey', () => {
  it('maps pathnames to page keys, project pages to work', () => {
    expect(activePageKey('/')).toBe('home')
    expect(activePageKey('/work')).toBe('work')
    expect(activePageKey('/work/pagal')).toBe('work')
    expect(activePageKey('/frames')).toBe('frames')
    expect(activePageKey('/nope')).toBe(null)
  })
})

describe('navEntries', () => {
  it('returns pages 2–5 with the active flag', () => {
    const nav = navEntries(pages, '/work/pagal')
    expect(nav.map((n) => [n.key, n.active])).toEqual([['about', false], ['work', true], ['frames', false], ['contact', false]])
  })
})

describe('preFooterEntries', () => {
  it('excludes the current page and returns the first three in prototype order', () => {
    expect(preFooterEntries(pages, '/').map((p) => p.key)).toEqual(['about', 'work', 'frames'])
    expect(preFooterEntries(pages, '/about').map((p) => p.key)).toEqual(['work', 'frames', 'contact'])
    expect(preFooterEntries(pages, '/work/x').map((p) => p.key)).toEqual(['about', 'frames', 'contact'])
  })
})
