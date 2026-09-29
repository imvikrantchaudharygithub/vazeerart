import {describe, expect, it} from 'vitest'
import {alternateOrder, deriveProjects, filterProjects, homeProjects, nextProject, pageProjects, parseWorkFilter, showreelOrderNote, toProjectCard} from './projects'

const raw = (slug: string, category: 'dop' | 'editor', creditOnly = false, showOnHome = true) => ({
  _id: `project-${slug}`, title: slug.toUpperCase(), slug, format: 'Music Video', year: '2022',
  role: category === 'dop' ? 'Director of Photography' : 'Editor', category,
  cover: null, frameGrabs: null, videoUrl: null, showOnHome, creditOnly, seo: null,
})

const all = deriveProjects([raw('a', 'dop'), raw('credit', 'dop', true), raw('b', 'editor'), raw('c', 'dop', false, false)] as any)

describe('deriveProjects', () => {
  it('numbers page projects only, in order, padded to two digits', () => {
    expect(all.map((p) => [p.slug, p.n])).toEqual([['a', '01'], ['credit', ''], ['b', '02'], ['c', '03']])
  })
  it('derives roleShort and formatLower', () => {
    expect(all[0].roleShort).toBe('DOP')
    expect(all[2].roleShort).toBe('Editor')
    expect(all[0].formatLower).toBe('music video')
  })
})

describe('pageProjects / filterProjects', () => {
  const pages = pageProjects(all)
  it('excludes credit-only entries', () => {
    expect(pages.map((p) => p.slug)).toEqual(['a', 'b', 'c'])
  })
  it('filters by category', () => {
    expect(filterProjects(pages, 'all').map((p) => p.slug)).toEqual(['a', 'b', 'c'])
    expect(filterProjects(pages, 'cinematography').map((p) => p.slug)).toEqual(['a', 'c'])
    expect(filterProjects(pages, 'editing').map((p) => p.slug)).toEqual(['b'])
  })
})

describe('toProjectCard', () => {
  it('keeps exactly the nine keys the /work list renders — no frameGrabs or seo', () => {
    const card = toProjectCard(all[0])
    expect(Object.keys(card).sort()).toEqual(['category', 'cover', 'formatLower', 'id', 'n', 'role', 'slug', 'title', 'year'])
    expect(card).toEqual({id: 'project-a', slug: 'a', title: 'A', formatLower: 'music video', year: '2022', role: 'Director of Photography', category: 'dop', cover: null, n: '01'})
  })
  it('lets filterProjects run on cards', () => {
    const cards = pageProjects(all).map(toProjectCard)
    expect(filterProjects(cards, 'editing').map((c) => c.slug)).toEqual(['b'])
  })
})

describe('alternateOrder', () => {
  it('gives every second visible item order 2, counting visible items only (prototype vi++ % 2)', () => {
    expect(alternateOrder(3)).toEqual([0, 2, 0])
    expect(alternateOrder(4)).toEqual([0, 2, 0, 2])
  })
})

describe('nextProject', () => {
  const pages = pageProjects(all)
  it('wraps to the first page project and skips credit-only', () => {
    expect(nextProject(pages, 'a')?.slug).toBe('b')
    expect(nextProject(pages, 'c')?.slug).toBe('a')
    expect(nextProject(pages, 'missing')).toBeNull()
  })
})

describe('showreelOrderNote', () => {
  it('joins page project titles unless overridden', () => {
    expect(showreelOrderNote(pageProjects(all), 'in order of appearance:', null)).toBe('(in order of appearance: A, B, C)')
    expect(showreelOrderNote(pageProjects(all), 'x', 'Custom')).toBe('(x Custom)')
  })
})

describe('homeProjects', () => {
  it('excludes credit-only and showOnHome:false entries', () => {
    expect(homeProjects(all).map((p) => p.slug)).toEqual(['a', 'b'])
  })
})

describe('parseWorkFilter', () => {
  it('accepts known filters and falls back to all', () => {
    expect(parseWorkFilter('editing')).toBe('editing')
    expect(parseWorkFilter('bogus')).toBe('all')
    expect(parseWorkFilter(undefined)).toBe('all')
  })
})
