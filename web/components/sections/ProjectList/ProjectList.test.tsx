// web/components/sections/ProjectList/ProjectList.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {projectDetailPages} from '@/lib/flags'
import {toProjectCard, type ProjectVM} from '@/lib/viewmodel/projects'
import {ProjectList} from './ProjectList'

const p = (slug: string, category: 'dop' | 'editor', n: string): ProjectVM => ({
  id: slug, slug, title: slug.toUpperCase(), format: 'Music Video', formatLower: 'music video', year: '2022',
  role: category === 'dop' ? 'Director of Photography' : 'Editor', roleShort: category === 'dop' ? 'DOP' : 'Editor', category,
  cover: null, frameGrabs: [], videoUrl: null, showOnHome: true, creditOnly: false, n, seo: {title: null, description: null, image: null},
})
const projects = [p('a', 'dop', '01'), p('b', 'editor', '02'), p('c', 'dop', '03')].map(toProjectCard)

describe('ProjectList with project pages linked', () => {
  it('alternates the cover position among visible items only', () => {
    render(<ProjectList projects={projects} filter="all" numberPrefix="no." cta="Watch →" linkToDetail />)
    const covers = screen.getAllByRole('link', {name: /^Open/})
    expect(covers.map((c) => c.getAttribute('data-order'))).toEqual(['0', '2', '0'])
  })
  it('links every cover and CTA to /work/<slug>', () => {
    render(<ProjectList projects={projects} filter="all" numberPrefix="no." cta="Watch →" linkToDetail />)
    expect(screen.getAllByRole('link', {name: /^Open/}).map((c) => c.getAttribute('href'))).toEqual(['/work/a', '/work/b', '/work/c'])
    expect(screen.getAllByRole('link', {name: 'Watch →'}).map((c) => c.getAttribute('href'))).toEqual(['/work/a', '/work/b', '/work/c'])
  })
  it('filters by category and keeps the original numbering', () => {
    render(<ProjectList projects={projects} filter="cinematography" numberPrefix="no." cta="Watch →" linkToDetail />)
    expect(screen.queryByText('B')).toBeNull()
    expect(screen.getByText('no. 01')).toBeInTheDocument()
    expect(screen.getByText('no. 03')).toBeInTheDocument()
    const covers = screen.getAllByRole('link', {name: /^Open/})
    expect(covers.map((c) => c.getAttribute('data-order'))).toEqual(['0', '2'])
  })
  it('renders a single visible item with order 0', () => {
    render(<ProjectList projects={projects} filter="editing" numberPrefix="no." cta="Watch →" linkToDetail />)
    expect(screen.getAllByRole('link', {name: /^Open/}).map((c) => c.getAttribute('data-order'))).toEqual(['0'])
  })
})

describe('ProjectList with project pages hidden', () => {
  it('renders static covers in the same alternating order and drops the CTA', () => {
    render(<ProjectList projects={projects} filter="all" numberPrefix="no." cta="Watch →" linkToDetail={false} />)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.queryByText('Watch →')).toBeNull()
    expect(screen.getAllByTestId('project-cover').map((c) => c.getAttribute('data-order'))).toEqual(['0', '2', '0'])
    expect(screen.getByText('no. 02')).toBeInTheDocument()
  })
  it('still filters by category', () => {
    render(<ProjectList projects={projects} filter="editing" numberPrefix="no." cta="Watch →" linkToDetail={false} />)
    expect(screen.getAllByTestId('project-cover')).toHaveLength(1)
    expect(screen.getByText('no. 02')).toBeInTheDocument()
  })
  it('follows lib/flags.ts when the prop is omitted', () => {
    render(<ProjectList projects={projects} filter="all" numberPrefix="no." cta="Watch →" />)
    expect(screen.queryAllByRole('link')).toHaveLength(projectDetailPages ? 6 : 0)
  })
})
