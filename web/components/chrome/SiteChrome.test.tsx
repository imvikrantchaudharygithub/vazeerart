import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {SiteSettingsVM} from '@/lib/viewmodel/site'
import {SiteChrome} from './SiteChrome'

let pathname = '/'
vi.mock('next/navigation', () => ({usePathname: () => pathname}))

const settings: SiteSettingsVM = {
  brandWord: 'Vazeer', brandScript: 'art.', copyright: '©', socials: [{label: 'Instagram', url: 'https://instagram.com/x'}],
  management: {label: 'management', handle: '@m', url: '#'}, dm: {label: 'dm me', handle: '@d', url: '#'},
  marqueeWords: [], leaderLeft: '', leaderRight: '', leaderSkip: '', menuScript: 'menu', menuClose: 'Close ✕', menuSocialsLabel: 'follow on socials /',
  menuPhoto: null, showIntro: true, showMarquee: true, showGrain: true, showRec: true, seo: {title: null, description: null, image: null},
  pages: [
    {key: 'home', href: '/', navLabel: 'Home', menuLabel: 'Home', preFooterScript: '', preFooterLabel: ''},
    {key: 'about', href: '/about', navLabel: 'About', menuLabel: 'About', preFooterScript: 'learn more', preFooterLabel: 'About me'},
    {key: 'work', href: '/work', navLabel: 'Work & Reels', menuLabel: 'Work & Reels', preFooterScript: 'watch the', preFooterLabel: 'Reels'},
    {key: 'frames', href: '/frames', navLabel: 'Frames', menuLabel: 'Frames', preFooterScript: 'browse the', preFooterLabel: 'Frames'},
    {key: 'contact', href: '/contact', navLabel: 'Contact', menuLabel: 'Contact', preFooterScript: 'get in', preFooterLabel: 'Touch'},
  ],
}

describe('SiteChrome', () => {
  beforeEach(() => { pathname = '/work/pagal' })

  it('renders the four nav links and marks Work active on a project page', () => {
    render(<SiteChrome settings={settings} />)
    const links = screen.getAllByRole('link').filter((a) => a.closest('nav'))
    expect(links.map((a) => a.textContent)).toEqual(['About', 'Work & Reels', 'Frames', 'Contact'])
    expect(links[1].getAttribute('data-active')).toBe('true')
    expect(links[0].getAttribute('data-active')).toBe('false')
  })

  it('opens the menu with all five pages numbered, closes on Close and on Escape', () => {
    render(<SiteChrome settings={settings} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', {name: 'Open menu'}))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('01')
    expect(dialog).toHaveTextContent('05')
    expect(dialog).toHaveTextContent('Work & Reels')
    fireEvent.click(screen.getByRole('button', {name: 'Close ✕'}))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', {name: 'Open menu'}))
    fireEvent.keyDown(window, {key: 'Escape'})
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes the menu when the pathname changes', () => {
    const {rerender} = render(<SiteChrome settings={settings} />)
    fireEvent.click(screen.getByRole('button', {name: 'Open menu'}))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    pathname = '/about'
    rerender(<SiteChrome settings={settings} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
