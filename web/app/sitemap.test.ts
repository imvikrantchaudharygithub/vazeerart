import {describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/data', () => ({
  getProjects: async () => [
    {slug: 'pagal', creditOnly: false},
    {slug: 'hidden', creditOnly: true},
  ],
}))
vi.mock('@/lib/env', () => ({env: {siteUrl: 'https://vazeerart.com', projectId: 'x', dataset: 'y', apiVersion: 'z', studioUrl: 's'}}))

describe('sitemap', () => {
  it('lists the five routes and page projects only', async () => {
    const {default: sitemap} = await import('./sitemap')
    const urls = (await sitemap()).map((e) => e.url)
    expect(urls).toEqual(['https://vazeerart.com/', 'https://vazeerart.com/work', 'https://vazeerart.com/frames', 'https://vazeerart.com/about', 'https://vazeerart.com/contact', 'https://vazeerart.com/work/pagal'])
  })
})
