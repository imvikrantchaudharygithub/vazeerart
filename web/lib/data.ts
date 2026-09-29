import 'server-only'
import type {ABOUT_QUERY_RESULT, CONTACT_QUERY_RESULT, FRAMES_PAGE_QUERY_RESULT, FRAMES_QUERY_RESULT, HOME_QUERY_RESULT, PROJECTS_QUERY_RESULT, SITE_SETTINGS_QUERY_RESULT, WORK_QUERY_RESULT} from '@/lib/sanity/types'
import {sanityFetch} from '@/lib/sanity/live'
import {ABOUT_QUERY, CONTACT_QUERY, FRAMES_PAGE_QUERY, FRAMES_QUERY, HOME_QUERY, PROJECTS_QUERY, PROJECT_SLUGS_QUERY, SITE_SETTINGS_QUERY, WORK_QUERY} from '@/lib/sanity/queries'
import {toAboutVM, toContactVM, toFramesPageVM, toFramesVM, toHomeVM, toWorkVM} from '@/lib/viewmodel/pagesContent'
import {deriveProjects} from '@/lib/viewmodel/projects'
import {toSiteSettingsVM} from '@/lib/viewmodel/site'

/**
 * sanityFetch brands strings as StegaString when `stega` is not passed (needed for click-to-edit),
 * which is not assignable to the generated literal unions. Runtime shape is identical; enum-like keys are
 * kept stega-free by lib/sanity/stega.ts.
 */
const asResult = <T,>(data: unknown) => data as T

export async function getSiteSettings() {
  const {data} = await sanityFetch({query: SITE_SETTINGS_QUERY})
  return toSiteSettingsVM(asResult<SITE_SETTINGS_QUERY_RESULT>(data))
}
export async function getHome() {
  const {data} = await sanityFetch({query: HOME_QUERY})
  return toHomeVM(asResult<HOME_QUERY_RESULT>(data))
}
export async function getWork() {
  const {data} = await sanityFetch({query: WORK_QUERY})
  return toWorkVM(asResult<WORK_QUERY_RESULT>(data))
}
export async function getFramesPage() {
  const {data} = await sanityFetch({query: FRAMES_PAGE_QUERY})
  return toFramesPageVM(asResult<FRAMES_PAGE_QUERY_RESULT>(data))
}
export async function getFrames() {
  const [{data}, page] = await Promise.all([sanityFetch({query: FRAMES_QUERY}), getFramesPage()])
  return toFramesVM(asResult<FRAMES_QUERY_RESULT>(data), page)
}
export async function getAbout() {
  const {data} = await sanityFetch({query: ABOUT_QUERY})
  return toAboutVM(asResult<ABOUT_QUERY_RESULT>(data))
}
export async function getContact() {
  const {data} = await sanityFetch({query: CONTACT_QUERY})
  return toContactVM(asResult<CONTACT_QUERY_RESULT>(data))
}
export async function getProjects() {
  const {data} = await sanityFetch({query: PROJECTS_QUERY})
  return deriveProjects(asResult<PROJECTS_QUERY_RESULT>(data))
}
/** For generateStaticParams: published only, no stega. */
export async function getProjectSlugs() {
  const {data} = await sanityFetch({query: PROJECT_SLUGS_QUERY, perspective: 'published', stega: false})
  return data.flatMap((d) => (d.slug ? [{slug: d.slug}] : []))
}
