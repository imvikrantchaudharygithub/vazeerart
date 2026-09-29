// studio/scripts/lib/buildDocuments.ts
import {COPY, EXPLORE_CARDS, FORM_TYPES, FRAME_KEYS, FRAME_RATIOS_SEED, MARQUEE_WORDS, PAGES, PROJECTS, SKILLS, SLOT_ALT, SLOT_IMAGE, SOCIALS} from './designData'
import {grabKeysFor, lexoRank} from './grabs'

export const IMAGE_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'V', 'W'] as const
export type ImageKey = (typeof IMAGE_KEYS)[number]

type AssetIdByKey = Record<string, string>
type SanityDoc = {_id: string; _type: string; [key: string]: unknown}

function img(assetIds: AssetIdByKey, key: string, alt: string, keySuffix: string) {
  const ref = assetIds[key]
  if (!ref) throw new Error(`No asset uploaded for key ${key}`)
  return {_type: 'imageWithAlt', _key: keySuffix, asset: {_type: 'reference', _ref: ref}, alt}
}

function media(assetIds: AssetIdByKey, key: string, alt: string, keySuffix: string) {
  return {_type: 'mediaSlot', kind: 'image', image: img(assetIds, key, alt, `${keySuffix}-img`)}
}

export function buildDocuments(assetIds: AssetIdByKey): SanityDoc[] {
  const slot = (name: keyof typeof SLOT_IMAGE) => img(assetIds, SLOT_IMAGE[name], SLOT_ALT[name], name)
  const mediaSlot = (name: keyof typeof SLOT_IMAGE) => media(assetIds, SLOT_IMAGE[name], SLOT_ALT[name], name)

  const siteSettings: SanityDoc = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    brandWord: 'Vazeer',
    brandScript: 'art.',
    copyright: COPY.copyright,
    socials: SOCIALS.map((s, i) => ({_type: 'link', _key: `social-${i}`, ...s})),
    management: {...COPY.management},
    dm: {...COPY.dm},
    marqueeWords: [...MARQUEE_WORDS],
    pages: PAGES.map((p) => ({_type: 'pageEntry', _key: `page-${p.key}`, ...p})),
    leaderLeft: COPY.leader.left,
    leaderRight: COPY.leader.right,
    leaderSkip: COPY.leader.skip,
    menuScript: COPY.menu.script,
    menuClose: COPY.menu.close,
    menuSocialsLabel: COPY.menu.socials,
    menuPhoto: slot('menuPhoto'),
    showIntro: true,
    showMarquee: true,
    showGrain: true,
    showRec: true,
    seo: {_type: 'seo', title: 'Vazeer Art — DOP & editor, New Delhi', description: 'Cinematographer and editor for films, commercials and music videos.'},
  }

  const homePage: SanityDoc = {
    _id: 'homePage',
    _type: 'homePage',
    hero: {
      word: COPY.home.hero.word,
      script: COPY.home.hero.script,
      mainImage: slot('heroMain'),
      polaroidLeft: mediaSlot('heroPolaroidLeft'),
      polaroidRight: mediaSlot('heroPolaroidRight'),
    },
    intro: {...COPY.home.intro, imageA: slot('introA'), imageB: slot('introB')},
    reels: {headingBlock: {_type: 'headingBlock', script: COPY.home.reels.script, heading: COPY.home.reels.heading}, ctaLabel: COPY.home.reels.ctaLabel},
    explore: {
      headingBlock: {_type: 'headingBlock', ...COPY.home.explore},
      cards: EXPLORE_CARDS.map((c, i) => ({
        _type: 'exploreCard',
        _key: `explore-${i}`,
        label: c.label,
        sub: c.sub,
        target: c.target,
        image: img(assetIds, c.image, c.alt, `explore-${i}`),
      })),
    },
    currently: {...COPY.home.currently, bgImage: slot('currentlyBg')},
  }

  const workPage: SanityDoc = {
    _id: 'workPage',
    _type: 'workPage',
    title: COPY.work.title,
    script: COPY.work.script,
    intro: COPY.work.intro,
    filterAll: COPY.work.filters.all,
    filterDop: COPY.work.filters.dop,
    filterEditor: COPY.work.filters.editor,
    showreel: {poster: slot('showreelPoster'), label: COPY.work.showreel.label, orderNotePrefix: COPY.work.showreel.orderNotePrefix},
    numberPrefix: COPY.work.numberPrefix,
    projectCta: COPY.work.projectCta,
    skills: {
      headingBlock: {_type: 'headingBlock', ...COPY.work.skills},
      items: SKILLS.map((s, i) => ({_type: 'skill', _key: `skill-${i}`, label: s.label, tilt: s.tilt, media: media(assetIds, s.image, `GIF: ${s.label}`, `skill-${i}`)})),
    },
    projectPage: {...COPY.work.projectPage},
  }

  const framesPage: SanityDoc = {_id: 'framesPage', _type: 'framesPage', ...COPY.frames}

  const aboutPage: SanityDoc = {
    _id: 'aboutPage',
    _type: 'aboutPage',
    hero: {...COPY.about.hero, portrait: slot('aboutPortrait'), polaroid: mediaSlot('aboutPolaroid')},
    statement: {...COPY.about.statement, paragraphs: [...COPY.about.statement.paragraphs]},
    credits: {
      headingBlock: {_type: 'headingBlock', script: COPY.about.credits.script, heading: COPY.about.credits.heading},
      imdbLabel: COPY.about.credits.imdbLabel,
      imdbUrl: COPY.about.credits.imdbUrl,
    },
    finale: {...COPY.about.finale, bgImage: slot('aboutFinaleBg')},
  }

  const contactPage: SanityDoc = {
    _id: 'contactPage',
    _type: 'contactPage',
    script: COPY.contact.script,
    heading: COPY.contact.heading,
    intro: COPY.contact.intro,
    photo: slot('contactPhoto'),
    form: {...COPY.contact.form, types: [...FORM_TYPES]},
    success: {...COPY.contact.success},
  }

  const projects: SanityDoc[] = PROJECTS.map((p, i) => ({
    _id: `project-${p.slug}`,
    _type: 'project',
    orderRank: lexoRank(i),
    title: p.title,
    slug: {_type: 'slug', current: p.slug},
    format: p.format,
    year: p.year,
    role: p.role,
    category: p.category,
    cover: img(assetIds, p.cover, `Frame from ${p.title}`, `cover-${p.slug}`),
    frameGrabs: grabKeysFor(i).map((k, n) => img(assetIds, k, `Frame grab 0${n + 1} from ${p.title}`, `${p.slug}-grab-${n}`)),
    showOnHome: true,
    creditOnly: false,
  }))

  const frames: SanityDoc[] = FRAME_KEYS.map((k, i) => ({
    _id: `frame-${String(i + 1).padStart(2, '0')}`,
    _type: 'frame',
    orderRank: lexoRank(i),
    image: img(assetIds, k, FRAME_RATIOS_SEED[i] === '9/16' ? 'Reel cover' : 'Instagram post', `frame-${i}`),
    ratio: FRAME_RATIOS_SEED[i],
  }))

  return [siteSettings, homePage, workPage, framesPage, aboutPage, contactPage, ...projects, ...frames]
}
