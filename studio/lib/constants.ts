export const SINGLETON_TYPES = [
  'siteSettings',
  'homePage',
  'workPage',
  'framesPage',
  'aboutPage',
  'contactPage',
] as const
export type SingletonType = (typeof SINGLETON_TYPES)[number]

export const PAGE_KEYS = ['home', 'about', 'work', 'frames', 'contact'] as const
export type PageKey = (typeof PAGE_KEYS)[number]

export const PAGE_ROUTES: Record<PageKey, string> = {
  home: '/',
  about: '/about',
  work: '/work',
  frames: '/frames',
  contact: '/contact',
}

export const EXPLORE_TARGETS = ['work', 'frames', 'contact', 'about'] as const

export const FRAME_RATIOS = ['4/5', '9/16', '1/1', '16/9'] as const

export const PROJECT_CATEGORIES = [
  {value: 'dop', title: 'Cinematography (DOP)'},
  {value: 'editor', title: 'Editing (Editor)'},
] as const
