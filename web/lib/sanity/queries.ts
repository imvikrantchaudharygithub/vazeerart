import {defineQuery} from 'next-sanity'

export const IMAGE_FIELDS = /* groq */ `{
  alt, hotspot, crop,
  asset->{ _id, url, extension, "width": metadata.dimensions.width, "height": metadata.dimensions.height, "lqip": metadata.lqip }
}`

export const MEDIA_FIELDS = /* groq */ `{ kind, image ${IMAGE_FIELDS}, "videoUrl": video.asset->url }`

export const SEO_FIELDS = /* groq */ `{ title, description, image ${IMAGE_FIELDS} }`

export const PROJECT_FIELDS = /* groq */ `{
  _id, title, "slug": slug.current, format, year, role, category,
  cover ${IMAGE_FIELDS}, frameGrabs[] ${IMAGE_FIELDS}, videoUrl, showOnHome, creditOnly, seo ${SEO_FIELDS}
}`

export const SITE_SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings" && _id == "siteSettings"][0]{
  brandWord, brandScript, copyright,
  socials[]{ label, url },
  management{ label, handle, url }, dm{ label, handle, url },
  marqueeWords,
  pages[]{ key, navLabel, menuLabel, preFooterScript, preFooterLabel },
  leaderLeft, leaderRight, leaderSkip, menuScript, menuClose, menuSocialsLabel,
  menuPhoto ${IMAGE_FIELDS},
  showIntro, showMarquee, showGrain, showRec,
  seo ${SEO_FIELDS}
}`)

export const HOME_QUERY = defineQuery(`*[_type == "homePage" && _id == "homePage"][0]{
  hero{ word, script, mainImage ${IMAGE_FIELDS}, polaroidLeft ${MEDIA_FIELDS}, polaroidRight ${MEDIA_FIELDS} },
  mobileHero{ word, script, image ${IMAGE_FIELDS}, thumb ${MEDIA_FIELDS} },
  intro{ script, heading, subline, body, ctaLabel, imageA ${IMAGE_FIELDS}, imageB ${IMAGE_FIELDS} },
  reels{ headingBlock{ script, heading }, ctaLabel },
  explore{ headingBlock{ script, heading }, cards[]{ label, sub, target, image ${IMAGE_FIELDS} } },
  currently{ script, heading, body, ctaLabel, bgImage ${IMAGE_FIELDS} },
  seo ${SEO_FIELDS}
}`)

export const WORK_QUERY = defineQuery(`*[_type == "workPage" && _id == "workPage"][0]{
  title, script, intro, filterAll, filterDop, filterEditor,
  showreel{ poster ${IMAGE_FIELDS}, videoUrl, label, orderNotePrefix, orderNoteOverride },
  numberPrefix, projectCta,
  skills{ headingBlock{ script, heading }, items[]{ label, tilt, media ${MEDIA_FIELDS} } },
  projectPage{ backLabel, reelPrefix, roleLabel, formatLabel, yearLabel, aspectLabel, grabsScript, grabsHeading, upNextScript },
  seo ${SEO_FIELDS}
}`)

export const FRAMES_PAGE_QUERY = defineQuery(`*[_type == "framesPage" && _id == "framesPage"][0]{
  script, heading, linkLabel, linkUrl, reelLabel, postLabel, seo ${SEO_FIELDS}
}`)

export const FRAMES_QUERY = defineQuery(`*[_type == "frame"] | order(orderRank){
  _id, image ${IMAGE_FIELDS}, ratio, instagramUrl
}`)

export const ABOUT_QUERY = defineQuery(`*[_type == "aboutPage" && _id == "aboutPage"][0]{
  hero{ script, heading, body, ctaLabel, portrait ${IMAGE_FIELDS}, polaroid ${MEDIA_FIELDS} },
  statement{ headingPlain, headingAccent, paragraphs, aside },
  credits{ headingBlock{ script, heading }, imdbLabel, imdbUrl },
  finale{ script, sub, bgImage ${IMAGE_FIELDS} },
  seo ${SEO_FIELDS}
}`)

export const CONTACT_QUERY = defineQuery(`*[_type == "contactPage" && _id == "contactPage"][0]{
  script, heading, intro, photo ${IMAGE_FIELDS},
  form{ heading, typeQuestion, types, nameLabel, contactLabel, datesLabel, briefLabel, submitLabel },
  success{ script, body, resetLabel },
  seo ${SEO_FIELDS}
}`)

export const PROJECTS_QUERY = defineQuery(`*[_type == "project"] | order(orderRank) ${PROJECT_FIELDS}`)

export const PROJECT_SLUGS_QUERY = defineQuery(`*[_type == "project" && creditOnly != true && defined(slug.current)]{ "slug": slug.current }`)

export const CONTACT_TYPES_QUERY = defineQuery(`*[_type == "contactPage" && _id == "contactPage"][0].form.types`)
