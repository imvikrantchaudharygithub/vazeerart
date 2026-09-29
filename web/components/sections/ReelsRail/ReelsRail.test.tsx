import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import {homeProjects} from '@/lib/viewmodel/projects'
import {ReelsRail} from './ReelsRail'

const p = (slug: string, extra: Partial<ProjectVM> = {}): ProjectVM => ({
  id: slug, slug, title: slug.toUpperCase(), format: 'Music Video', formatLower: 'music video', year: '2022', role: 'DOP', roleShort: 'DOP', category: 'dop',
  cover: null, frameGrabs: [], videoUrl: null, showOnHome: true, creditOnly: false, n: '01', seo: {title: null, description: null, image: null}, ...extra,
})

describe('ReelsRail', () => {
  it('links each shown project to its page with title and (format, year)', () => {
    const projects = homeProjects([p('pagal'), p('hidden', {showOnHome: false}), p('credit', {creditOnly: true})])
    render(<ReelsRail reels={{script: 'now showing', heading: 'Selected reels', ctaLabel: 'All work & reels →'}} projects={projects} />)
    const cards = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/work/'))
    expect(cards.map((a) => a.getAttribute('href'))).toEqual(['/work/pagal'])
    expect(cards[0]).toHaveTextContent('PAGAL')
    expect(cards[0]).toHaveTextContent('(music video, 2022)')
    expect(cards[0].getAttribute('data-reveal')).toBe('1')
    expect(screen.getByRole('link', {name: 'All work & reels →'})).toHaveAttribute('href', '/work')
  })
})
