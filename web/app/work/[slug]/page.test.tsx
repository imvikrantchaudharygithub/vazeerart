// web/app/work/[slug]/page.test.tsx
import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const notFound = vi.fn(() => { throw new Error('NEXT_NOT_FOUND') })
vi.mock('next/navigation', () => ({notFound}))

const project = (slug: string, title: string, n: string, creditOnly: boolean) => ({
  id: slug, slug, title, format: 'Music Video', formatLower: 'music video', year: '2022', role: 'Director of Photography', roleShort: 'DOP', category: 'dop',
  cover: null, frameGrabs: [], videoUrl: null, showOnHome: true, creditOnly, n, seo: {title: null, description: null, image: null},
})
const credit = project('credit', 'C', '', true)
const pagal = project('pagal', 'Pagal', '01', false)
const loveMarriage = project('love-marriage', 'Love Marriage', '02', false)
let mockProjects = [credit]

vi.mock('@/lib/data', () => ({
  getWork: async () => ({projectPage: {backLabel: 'b', reelPrefix: 'r', roleLabel: 'role', formatLabel: 'format', yearLabel: 'year', aspectLabel: 'a', grabsScript: 'g', grabsHeading: 'G', upNextScript: 'up next'}}),
  getSiteSettings: async () => ({showRec: true}),
  getProjects: async () => mockProjects,
  getProjectSlugs: async () => [],
}))

beforeEach(() => { notFound.mockClear(); mockProjects = [credit] })

describe('project page', () => {
  it('404s for credit-only and unknown slugs', async () => {
    const {default: Page} = await import('./page')
    await expect(Page({params: Promise.resolve({slug: 'credit'})})).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(Page({params: Promise.resolve({slug: 'nope'})})).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalledTimes(2)
  })

  it('renders a page project and links Up next to the following page project, wrapping round', async () => {
    mockProjects = [credit, pagal, loveMarriage]
    const {default: Page} = await import('./page')
    render(await Page({params: Promise.resolve({slug: 'love-marriage'})}))
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Love Marriage')
    expect(screen.getByRole('link', {name: /up next/i})).toHaveAttribute('href', '/work/pagal')
    expect(notFound).not.toHaveBeenCalled()
  })

  it('renders no Up next link when the project is the only page project', async () => {
    mockProjects = [credit, pagal]
    const {default: Page} = await import('./page')
    render(await Page({params: Promise.resolve({slug: 'pagal'})}))
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent('Pagal')
    expect(screen.queryByRole('link', {name: /up next/i})).toBeNull()
  })
})
