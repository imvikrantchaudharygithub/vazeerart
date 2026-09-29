// web/components/sections/ProjectList/ProjectList.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import {ProjectList} from './ProjectList'

const p = (slug: string, category: 'dop' | 'editor', n: string): ProjectVM => ({
  id: slug, slug, title: slug.toUpperCase(), format: 'Music Video', formatLower: 'music video', year: '2022',
  role: category === 'dop' ? 'Director of Photography' : 'Editor', roleShort: category === 'dop' ? 'DOP' : 'Editor', category,
  cover: null, frameGrabs: [], videoUrl: null, showOnHome: true, creditOnly: false, n, seo: {title: null, description: null, image: null},
})
const projects = [p('a', 'dop', '01'), p('b', 'editor', '02'), p('c', 'dop', '03')]

describe('ProjectList', () => {
  it('alternates the cover position among visible items only', () => {
    render(<ProjectList projects={projects} filter="all" numberPrefix="no." cta="Watch →" />)
    const covers = screen.getAllByRole('link', {name: /^Open/})
    expect(covers.map((c) => c.getAttribute('data-order'))).toEqual(['0', '2', '0'])
  })
  it('filters by category and keeps the original numbering', () => {
    render(<ProjectList projects={projects} filter="cinematography" numberPrefix="no." cta="Watch →" />)
    expect(screen.queryByText('B')).toBeNull()
    expect(screen.getByText('no. 01')).toBeInTheDocument()
    expect(screen.getByText('no. 03')).toBeInTheDocument()
    const covers = screen.getAllByRole('link', {name: /^Open/})
    expect(covers.map((c) => c.getAttribute('data-order'))).toEqual(['0', '2'])
  })
  it('renders a single visible item with order 0', () => {
    render(<ProjectList projects={projects} filter="editing" numberPrefix="no." cta="Watch →" />)
    expect(screen.getAllByRole('link', {name: /^Open/}).map((c) => c.getAttribute('data-order'))).toEqual(['0'])
  })
})
