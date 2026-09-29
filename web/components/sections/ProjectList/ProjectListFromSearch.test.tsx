// web/components/sections/ProjectList/ProjectListFromSearch.test.tsx
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import type {ProjectCardVM} from '@/lib/viewmodel/projects'
import {ProjectListFromSearch} from './ProjectListFromSearch'

let filterParam: string | null = 'bogus'
vi.mock('next/navigation', () => ({useSearchParams: () => ({get: () => filterParam})}))

const card = (slug: string, category: 'dop' | 'editor', n: string): ProjectCardVM => ({
  id: slug, slug, title: slug.toUpperCase(), formatLower: 'music video', year: '2022',
  role: category === 'dop' ? 'Director of Photography' : 'Editor', category, cover: null, n,
})
const projects = [card('a', 'dop', '01'), card('b', 'editor', '02'), card('c', 'dop', '03')]

describe('ProjectListFromSearch', () => {
  it('treats an unknown ?filter= as all and renders every project', () => {
    filterParam = 'bogus'
    render(<ProjectListFromSearch projects={projects} numberPrefix="no." cta="Watch →" />)
    expect(screen.getAllByRole('heading', {level: 3}).map((h) => h.textContent)).toEqual(['A', 'B', 'C'])
  })
  it('narrows the list to the filter named in the query', () => {
    filterParam = 'editing'
    render(<ProjectListFromSearch projects={projects} numberPrefix="no." cta="Watch →" />)
    expect(screen.getAllByRole('heading', {level: 3}).map((h) => h.textContent)).toEqual(['B'])
  })
})
