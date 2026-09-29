import type {SITE_SETTINGS_QUERY_RESULT} from '@/lib/sanity/types'
import {bool, str, toImageVM, toSeoVM} from './images'
import {PAGE_KEYS, PAGE_ROUTES, type ImageVM, type LinkVM, type PageKey, type SeoVM} from './types'

export type PageEntryVM = {key: PageKey; href: string; navLabel: string; menuLabel: string; preFooterScript: string; preFooterLabel: string}
export type ContactLinkVM = {label: string; handle: string; url: string}

export type SiteSettingsVM = {
  brandWord: string; brandScript: string; copyright: string
  socials: LinkVM[]
  management: ContactLinkVM; dm: ContactLinkVM
  marqueeWords: string[]
  pages: PageEntryVM[]
  leaderLeft: string; leaderRight: string; leaderSkip: string
  menuScript: string; menuClose: string; menuSocialsLabel: string
  menuPhoto: ImageVM | null
  showIntro: boolean; showMarquee: boolean; showGrain: boolean; showRec: boolean
  seo: SeoVM
}

export class ContentMissingError extends Error {
  constructor(id: string) {
    super(`Sanity document "${id}" is missing — run \`npm run seed\` in studio/`)
  }
}

export const isPageKey = (k: string | null): k is PageKey => !!k && (PAGE_KEYS as readonly string[]).includes(k)

export function toSiteSettingsVM(raw: SITE_SETTINGS_QUERY_RESULT): SiteSettingsVM {
  if (!raw) throw new ContentMissingError('siteSettings')
  const contact = (c: {label: string | null; handle: string | null; url: string | null} | null, label: string): ContactLinkVM => ({
    label: str(c?.label, label), handle: str(c?.handle), url: str(c?.url, '#'),
  })
  return {
    brandWord: str(raw.brandWord, 'Vazeer'),
    brandScript: str(raw.brandScript, 'art.'),
    copyright: str(raw.copyright),
    socials: (raw.socials ?? []).flatMap((s) => (s.label && s.url ? [{label: s.label, url: s.url}] : [])),
    management: contact(raw.management, 'management'),
    dm: contact(raw.dm, 'dm me'),
    marqueeWords: (raw.marqueeWords ?? []).filter((w): w is string => !!w),
    pages: (raw.pages ?? []).flatMap((p) =>
      isPageKey(p.key)
        ? [{key: p.key, href: PAGE_ROUTES[p.key], navLabel: str(p.navLabel, p.key), menuLabel: str(p.menuLabel, str(p.navLabel, p.key)), preFooterScript: str(p.preFooterScript), preFooterLabel: str(p.preFooterLabel)}]
        : [],
    ),
    leaderLeft: str(raw.leaderLeft, 'Vazeer Art'),
    leaderRight: str(raw.leaderRight, 'Showreel 2026'),
    leaderSkip: str(raw.leaderSkip, 'Skip →'),
    menuScript: str(raw.menuScript, 'menu'),
    menuClose: str(raw.menuClose, 'Close ✕'),
    menuSocialsLabel: str(raw.menuSocialsLabel, 'follow on socials /'),
    menuPhoto: toImageVM(raw.menuPhoto),
    showIntro: bool(raw.showIntro, true),
    showMarquee: bool(raw.showMarquee, true),
    showGrain: bool(raw.showGrain, true),
    showRec: bool(raw.showRec, true),
    seo: toSeoVM(raw.seo),
  }
}
