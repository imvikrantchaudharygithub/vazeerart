import type {PROJECTS_QUERY_RESULT} from '@/lib/sanity/types'
import {str, toImageVM, toSeoVM} from './images'
import type {ImageVM, SeoVM} from './types'

export type WorkFilter = 'all' | 'cinematography' | 'editing'
export const WORK_FILTERS: WorkFilter[] = ['all', 'cinematography', 'editing']

export type ProjectVM = {
  id: string; slug: string; title: string
  format: string; formatLower: string; year: string
  role: string; roleShort: 'DOP' | 'Editor'; category: 'dop' | 'editor'
  cover: ImageVM | null; frameGrabs: ImageVM[]
  videoUrl: string | null
  showOnHome: boolean; creditOnly: boolean
  /** "01", "02"… among page projects; "" for credit-only */
  n: string
  seo: SeoVM
}

export function deriveProjects(raw: PROJECTS_QUERY_RESULT): ProjectVM[] {
  let counter = 0
  return raw.flatMap((p) => {
    if (!p.slug || !p.title) return []
    const creditOnly = p.creditOnly === true
    const category: 'dop' | 'editor' = p.category === 'editor' ? 'editor' : 'dop'
    const n = creditOnly ? '' : String(++counter).padStart(2, '0')
    const format = str(p.format)
    return [{
      id: p._id, slug: p.slug, title: p.title,
      format, formatLower: format.toLowerCase(), year: str(p.year),
      role: str(p.role), roleShort: category === 'dop' ? 'DOP' : 'Editor', category,
      cover: toImageVM(p.cover),
      frameGrabs: (p.frameGrabs ?? []).flatMap((g) => { const vm = toImageVM(g); return vm ? [vm] : [] }),
      videoUrl: p.videoUrl ?? null,
      showOnHome: p.showOnHome !== false, creditOnly, n,
      seo: toSeoVM(p.seo),
    }]
  })
}

export const pageProjects = (all: ProjectVM[]) => all.filter((p) => !p.creditOnly)
export const homeProjects = (all: ProjectVM[]) => pageProjects(all).filter((p) => p.showOnHome)

export function filterProjects(pages: ProjectVM[], filter: WorkFilter): ProjectVM[] {
  if (filter === 'cinematography') return pages.filter((p) => p.category === 'dop')
  if (filter === 'editing') return pages.filter((p) => p.category === 'editor')
  return pages
}

/** Prototype: `order = visible && (vi++ % 2) ? 2 : 0` — counts visible items only. */
export function alternateOrder(visibleCount: number): number[] {
  return Array.from({length: visibleCount}, (_, i) => (i % 2 ? 2 : 0))
}

export function nextProject(pages: ProjectVM[], slug: string): ProjectVM | null {
  const i = pages.findIndex((p) => p.slug === slug)
  if (i === -1 || pages.length === 0) return null
  return pages[(i + 1) % pages.length]
}

export function showreelOrderNote(pages: ProjectVM[], prefix: string, override: string | null): string {
  return `(${prefix} ${override ?? pages.map((p) => p.title).join(', ')})`
}

export function parseWorkFilter(value: string | null | undefined): WorkFilter {
  return (WORK_FILTERS as string[]).includes(value ?? '') ? (value as WorkFilter) : 'all'
}
