import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import {homeProjects} from '@/lib/viewmodel/projects'
import {ReelsRail} from './ReelsRail'

const p = (slug: string, extra: Partial<ProjectVM> = {}): ProjectVM => ({
  id: slug, slug, title: slug.toUpperCase(), format: 'Music Video', formatLower: 'music video', year: '2022', role: 'DOP', roleShort: 'DOP', category: 'dop',
  cover: null, frameGrabs: [], videoUrl: null, showOnHome: true, creditOnly: false, n: '01', seo: {title: null, description: null, image: null}, ...extra,
})
const reels = {script: 'now showing', heading: 'Selected reels', ctaLabel: 'All work & reels →'}

describe('ReelsRail', () => {
  it('links each shown project to its page with title and (format, year)', () => {
    const projects = homeProjects([p('pagal'), p('hidden', {showOnHome: false}), p('credit', {creditOnly: true})])
    render(<ReelsRail reels={reels} projects={projects} linkToDetail />)
    const cards = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/work/'))
    expect(cards.map((a) => a.getAttribute('href'))).toEqual(['/work/pagal'])
    expect(cards[0]).toHaveTextContent('PAGAL')
    expect(cards[0]).toHaveTextContent('(music video, 2022)')
    expect(cards[0].getAttribute('data-reveal')).toBe('1')
    expect(screen.getByRole('link', {name: 'All work & reels →'})).toHaveAttribute('href', '/work')
  })
  it('renders static cards while project pages are hidden and keeps the /work CTA', () => {
    render(<ReelsRail reels={reels} projects={homeProjects([p('pagal')])} linkToDetail={false} />)
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', {name: 'All work & reels →'})).toHaveAttribute('href', '/work')
    const card = screen.getByTestId('reel-card')
    expect(card.tagName).toBe('DIV')
    expect(card).toHaveTextContent('PAGAL')
    expect(card).toHaveTextContent('(music video, 2022)')
    expect(card.getAttribute('data-reveal')).toBe('1')
  })
  it('renders a second, aria-hidden and inert card set for the drift, out of the link list and the tab order', () => {
    const {container} = render(<ReelsRail reels={reels} projects={homeProjects([p('pagal'), p('rooh')])} linkToDetail />)
    const rail = container.querySelector('[data-reel-rail]')!
    const clones = rail.querySelector('[data-reel-clone]')!
    expect(rail.lastElementChild).toBe(clones)
    expect(clones).toHaveAttribute('aria-hidden', 'true')
    expect(clones).toHaveAttribute('inert')
    const cloneLinks = clones.querySelectorAll('a')
    expect(cloneLinks).toHaveLength(2)
    cloneLinks.forEach((a) => expect(a).toHaveAttribute('tabindex', '-1'))
    expect([...cloneLinks].map((a) => a.textContent)).toEqual([...rail.querySelectorAll(':scope > a')].map((a) => a.textContent))
    expect(screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/work/'))).toHaveLength(2)
  })
  it('gives the clone cards no test id, so the visible cards stay unique', () => {
    render(<ReelsRail reels={reels} projects={homeProjects([p('pagal'), p('rooh')])} linkToDetail={false} />)
    expect(screen.getAllByTestId('reel-card')).toHaveLength(2)
  })
})
