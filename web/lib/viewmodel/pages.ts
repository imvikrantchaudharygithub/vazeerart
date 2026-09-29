import type {PageEntryVM} from './site'
import {PAGE_KEYS, PAGE_ROUTES, type PageKey} from './types'

export function activePageKey(pathname: string): PageKey | null {
  if (pathname === '/') return 'home'
  if (pathname === '/work' || pathname.startsWith('/work/')) return 'work'
  for (const key of PAGE_KEYS) if (pathname === PAGE_ROUTES[key]) return key
  return null
}

export type NavEntry = PageEntryVM & {active: boolean}

/** Header shows pages 2–5 (everything but home). */
export function navEntries(pages: PageEntryVM[], pathname: string): NavEntry[] {
  const active = activePageKey(pathname)
  return pages.filter((p) => p.key !== 'home').map((p) => ({...p, active: p.key === active}))
}

/** Prototype pre-footer order: about, work, frames, contact → drop current → first three. */
export function preFooterEntries(pages: PageEntryVM[], pathname: string): PageEntryVM[] {
  const active = activePageKey(pathname)
  const order: PageKey[] = ['about', 'work', 'frames', 'contact']
  return order
    .filter((k) => k !== active)
    .flatMap((k) => pages.filter((p) => p.key === k))
    .slice(0, 3)
}
