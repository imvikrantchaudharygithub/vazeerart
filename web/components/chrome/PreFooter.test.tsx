import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {PreFooter} from './PreFooter'

vi.mock('next/navigation', () => ({usePathname: () => '/about'}))

const pages = [
  {key: 'home', href: '/', navLabel: 'Home', menuLabel: 'Home', preFooterScript: '', preFooterLabel: ''},
  {key: 'about', href: '/about', navLabel: 'About', menuLabel: 'About', preFooterScript: 'learn more', preFooterLabel: 'About me'},
  {key: 'work', href: '/work', navLabel: 'Work & Reels', menuLabel: 'Work & Reels', preFooterScript: 'watch the', preFooterLabel: 'Reels'},
  {key: 'frames', href: '/frames', navLabel: 'Frames', menuLabel: 'Frames', preFooterScript: 'browse the', preFooterLabel: 'Frames'},
  {key: 'contact', href: '/contact', navLabel: 'Contact', menuLabel: 'Contact', preFooterScript: 'get in', preFooterLabel: 'Touch'},
] as const

describe('PreFooter', () => {
  it('shows the three other pages with script and label, each a reveal element', () => {
    render(<PreFooter pages={[...pages]} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/work', '/frames', '/contact'])
    expect(links[0]).toHaveTextContent('watch the')
    expect(links[0]).toHaveTextContent('Reels')
    expect(links.every((l) => l.getAttribute('data-reveal') === '1')).toBe(true)
  })
})
