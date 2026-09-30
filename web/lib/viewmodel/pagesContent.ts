import type {ABOUT_QUERY_RESULT, CONTACT_QUERY_RESULT, FRAMES_PAGE_QUERY_RESULT, FRAMES_QUERY_RESULT, HOME_QUERY_RESULT, WORK_QUERY_RESULT} from '@/lib/sanity/types'
import {str, toImageVM, toMediaVM, toSeoVM} from './images'
import {ContentMissingError, isPageKey} from './site'
import {PAGE_ROUTES, type ImageVM, type MediaVM, type SeoVM} from './types'

/** Phone-only banner: each field falls back to the desktop hero's. `wordPath` is the field click-to-edit opens. */
export type MobileHeroVM = {word: string; script: string; image: ImageVM | null; thumb: MediaVM | null; wordPath: 'mobileHero.word' | 'hero.word'}

export type HomeVM = {
  hero: {word: string; script: string; mainImage: ImageVM | null; polaroidLeft: MediaVM | null; polaroidRight: MediaVM | null}
  mobileHero: MobileHeroVM
  intro: {script: string; heading: string; subline: string; body: string; ctaLabel: string; imageA: ImageVM | null; imageB: ImageVM | null}
  reels: {script: string; heading: string; ctaLabel: string}
  explore: {script: string; heading: string; cards: {label: string; sub: string; href: string; image: ImageVM | null}[]}
  currently: {script: string; heading: string; body: string; ctaLabel: string; bgImage: ImageVM | null}
  seo: SeoVM
}

export function toHomeVM(raw: HOME_QUERY_RESULT): HomeVM {
  if (!raw) throw new ContentMissingError('homePage')
  const target = (t: string | null): string => PAGE_ROUTES[isPageKey(t) ? t : 'work']
  const hero = {word: str(raw.hero?.word, 'Vazeer'), script: str(raw.hero?.script, 'art'), mainImage: toImageVM(raw.hero?.mainImage), polaroidLeft: toMediaVM(raw.hero?.polaroidLeft), polaroidRight: toMediaVM(raw.hero?.polaroidRight)}
  // A blank field counts as empty, so the phone banner never loses its name.
  const filled = (v: string | null | undefined) => (v && v.trim() ? v : '')
  const phoneWord = filled(raw.mobileHero?.word)
  return {
    hero,
    mobileHero: {
      word: phoneWord || hero.word,
      script: filled(raw.mobileHero?.script) || hero.script,
      image: toImageVM(raw.mobileHero?.image) ?? hero.mainImage,
      thumb: toMediaVM(raw.mobileHero?.thumb) ?? hero.polaroidLeft,
      wordPath: phoneWord ? 'mobileHero.word' : 'hero.word',
    },
    intro: {script: str(raw.intro?.script), heading: str(raw.intro?.heading), subline: str(raw.intro?.subline), body: str(raw.intro?.body), ctaLabel: str(raw.intro?.ctaLabel), imageA: toImageVM(raw.intro?.imageA), imageB: toImageVM(raw.intro?.imageB)},
    reels: {script: str(raw.reels?.headingBlock?.script), heading: str(raw.reels?.headingBlock?.heading), ctaLabel: str(raw.reels?.ctaLabel)},
    explore: {
      script: str(raw.explore?.headingBlock?.script), heading: str(raw.explore?.headingBlock?.heading),
      cards: (raw.explore?.cards ?? []).map((c) => ({label: str(c.label), sub: str(c.sub), href: target(c.target), image: toImageVM(c.image)})),
    },
    currently: {script: str(raw.currently?.script), heading: str(raw.currently?.heading), body: str(raw.currently?.body), ctaLabel: str(raw.currently?.ctaLabel), bgImage: toImageVM(raw.currently?.bgImage)},
    seo: toSeoVM(raw.seo),
  }
}

export type WorkVM = {
  title: string; script: string; intro: string
  filters: {all: string; cinematography: string; editing: string}
  showreel: {poster: ImageVM | null; videoUrl: string | null; label: string; orderNotePrefix: string; orderNoteOverride: string | null}
  numberPrefix: string; projectCta: string
  skills: {script: string; heading: string; items: {label: string; tilt: number; media: MediaVM | null}[]}
  projectPage: {backLabel: string; reelPrefix: string; roleLabel: string; formatLabel: string; yearLabel: string; aspectLabel: string; grabsScript: string; grabsHeading: string; upNextScript: string}
  seo: SeoVM
}

export function toWorkVM(raw: WORK_QUERY_RESULT): WorkVM {
  if (!raw) throw new ContentMissingError('workPage')
  const pp = raw.projectPage
  return {
    title: str(raw.title, 'Work'), script: str(raw.script, '& reels'), intro: str(raw.intro),
    filters: {all: str(raw.filterAll, 'All'), cinematography: str(raw.filterDop, 'Cinematography'), editing: str(raw.filterEditor, 'Editing')},
    showreel: {poster: toImageVM(raw.showreel?.poster), videoUrl: raw.showreel?.videoUrl ?? null, label: str(raw.showreel?.label, 'Showreel'), orderNotePrefix: str(raw.showreel?.orderNotePrefix, 'in order of appearance:'), orderNoteOverride: raw.showreel?.orderNoteOverride ?? null},
    numberPrefix: str(raw.numberPrefix, 'no.'), projectCta: str(raw.projectCta),
    skills: {script: str(raw.skills?.headingBlock?.script), heading: str(raw.skills?.headingBlock?.heading), items: (raw.skills?.items ?? []).map((s) => ({label: str(s.label), tilt: s.tilt ?? 0, media: toMediaVM(s.media)}))},
    projectPage: {backLabel: str(pp?.backLabel, '← Work & reels'), reelPrefix: str(pp?.reelPrefix, 'reel no.'), roleLabel: str(pp?.roleLabel, 'role'), formatLabel: str(pp?.formatLabel, 'format'), yearLabel: str(pp?.yearLabel, 'year'), aspectLabel: str(pp?.aspectLabel, '2.39 : 1'), grabsScript: str(pp?.grabsScript, 'frame'), grabsHeading: str(pp?.grabsHeading, 'Grabs'), upNextScript: str(pp?.upNextScript, 'up next')},
    seo: toSeoVM(raw.seo),
  }
}

export type FramesPageVM = {script: string; heading: string; linkLabel: string; linkUrl: string; reelLabel: string; postLabel: string; seo: SeoVM}
export function toFramesPageVM(raw: FRAMES_PAGE_QUERY_RESULT): FramesPageVM {
  if (!raw) throw new ContentMissingError('framesPage')
  return {script: str(raw.script), heading: str(raw.heading, 'Frames'), linkLabel: str(raw.linkLabel), linkUrl: str(raw.linkUrl, '#'), reelLabel: str(raw.reelLabel, 'Reel cover'), postLabel: str(raw.postLabel, 'Instagram post'), seo: toSeoVM(raw.seo)}
}

export type FrameVM = {id: string; image: ImageVM; ratio: '4/5' | '9/16' | '1/1' | '16/9'; instagramUrl: string | null; label: string}
export function toFramesVM(raw: FRAMES_QUERY_RESULT, page: FramesPageVM): FrameVM[] {
  return raw.flatMap((f) => {
    const image = toImageVM(f.image)
    if (!image) return []
    const ratio = (['4/5', '9/16', '1/1', '16/9'] as const).includes(f.ratio as never) ? (f.ratio as FrameVM['ratio']) : '4/5'
    return [{id: f._id, image, ratio, instagramUrl: f.instagramUrl ?? null, label: ratio === '9/16' ? page.reelLabel : page.postLabel}]
  })
}

export type AboutVM = {
  hero: {script: string; heading: string; body: string; ctaLabel: string; portrait: ImageVM | null; polaroid: MediaVM | null}
  statement: {headingPlain: string; headingAccent: string; paragraphs: string[]; aside: string}
  credits: {script: string; heading: string; imdbLabel: string; imdbUrl: string}
  finale: {script: string; sub: string; bgImage: ImageVM | null}
  seo: SeoVM
}
export function toAboutVM(raw: ABOUT_QUERY_RESULT): AboutVM {
  if (!raw) throw new ContentMissingError('aboutPage')
  return {
    hero: {script: str(raw.hero?.script), heading: str(raw.hero?.heading), body: str(raw.hero?.body), ctaLabel: str(raw.hero?.ctaLabel), portrait: toImageVM(raw.hero?.portrait), polaroid: toMediaVM(raw.hero?.polaroid)},
    statement: {headingPlain: str(raw.statement?.headingPlain), headingAccent: str(raw.statement?.headingAccent), paragraphs: (raw.statement?.paragraphs ?? []).filter((p): p is string => !!p), aside: str(raw.statement?.aside)},
    credits: {script: str(raw.credits?.headingBlock?.script), heading: str(raw.credits?.headingBlock?.heading), imdbLabel: str(raw.credits?.imdbLabel), imdbUrl: str(raw.credits?.imdbUrl, '#')},
    finale: {script: str(raw.finale?.script), sub: str(raw.finale?.sub), bgImage: toImageVM(raw.finale?.bgImage)},
    seo: toSeoVM(raw.seo),
  }
}

export type ContactVM = {
  script: string; heading: string; intro: string; photo: ImageVM | null
  form: {heading: string; typeQuestion: string; types: string[]; nameLabel: string; contactLabel: string; datesLabel: string; briefLabel: string; submitLabel: string}
  success: {script: string; body: string; resetLabel: string}
  seo: SeoVM
}
export function toContactVM(raw: CONTACT_QUERY_RESULT): ContactVM {
  if (!raw) throw new ContentMissingError('contactPage')
  return {
    script: str(raw.script), heading: str(raw.heading, 'Touch'), intro: str(raw.intro), photo: toImageVM(raw.photo),
    form: {heading: str(raw.form?.heading, 'The brief'), typeQuestion: str(raw.form?.typeQuestion), types: (raw.form?.types ?? []).filter((t): t is string => !!t), nameLabel: str(raw.form?.nameLabel), contactLabel: str(raw.form?.contactLabel), datesLabel: str(raw.form?.datesLabel), briefLabel: str(raw.form?.briefLabel), submitLabel: str(raw.form?.submitLabel, 'Send it →')},
    success: {script: str(raw.success?.script), body: str(raw.success?.body), resetLabel: str(raw.success?.resetLabel, 'Send another')},
    seo: toSeoVM(raw.seo),
  }
}
