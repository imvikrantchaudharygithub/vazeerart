// web/app/sitemap.ts
import type {MetadataRoute} from 'next'
import {getProjects} from '@/lib/data'
import {env} from '@/lib/env'
import {pageProjects} from '@/lib/viewmodel/projects'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl.replace(/\/$/, '')
  const projects = pageProjects(await getProjects())
  const now = new Date()
  return [
    ...['/', '/work', '/frames', '/about', '/contact'].map((p) => ({url: `${base}${p}`, lastModified: now})),
    ...projects.map((p) => ({url: `${base}/work/${p.slug}`, lastModified: now})),
  ]
}
