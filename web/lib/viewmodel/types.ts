export const PAGE_KEYS = ['home', 'about', 'work', 'frames', 'contact'] as const
export type PageKey = (typeof PAGE_KEYS)[number]
export const PAGE_ROUTES: Record<PageKey, string> = {home: '/', about: '/about', work: '/work', frames: '/frames', contact: '/contact'}

export type Hotspot = {x: number; y: number; width: number; height: number}
export type Crop = {top: number; bottom: number; left: number; right: number}

export type ImageVM = {
  assetId: string
  url: string
  width: number
  height: number
  extension: string
  lqip: string | null
  alt: string
  hotspot: Hotspot | null
  crop: Crop | null
}

export type MediaVM = {kind: 'image'; image: ImageVM} | {kind: 'video'; url: string}

export type SeoVM = {title: string | null; description: string | null; image: ImageVM | null}
export type LinkVM = {label: string; url: string}
