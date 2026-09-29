// web/app/work/[slug]/page.test.tsx
import {describe, expect, it, vi} from 'vitest'

const notFound = vi.fn(() => { throw new Error('NEXT_NOT_FOUND') })
vi.mock('next/navigation', () => ({notFound}))
vi.mock('@/lib/data', () => ({
  getWork: async () => ({projectPage: {backLabel: 'b', reelPrefix: 'r', roleLabel: 'role', formatLabel: 'format', yearLabel: 'year', aspectLabel: 'a', grabsScript: 'g', grabsHeading: 'G', upNextScript: 'u'}}),
  getSiteSettings: async () => ({showRec: true}),
  getProjects: async () => [
    {id: '1', slug: 'credit', title: 'C', format: '', formatLower: '', year: '', role: '', roleShort: 'DOP', category: 'dop', cover: null, frameGrabs: [], videoUrl: null, showOnHome: true, creditOnly: true, n: '', seo: {title: null, description: null, image: null}},
  ],
  getProjectSlugs: async () => [],
}))

describe('project page', () => {
  it('404s for credit-only and unknown slugs', async () => {
    const {default: Page} = await import('./page')
    await expect(Page({params: Promise.resolve({slug: 'credit'})})).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(Page({params: Promise.resolve({slug: 'nope'})})).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalledTimes(2)
  })
})
