import type {ABOUT_QUERY_RESULT, CONTACT_QUERY_RESULT, FRAMES_PAGE_QUERY_RESULT, FRAMES_QUERY_RESULT, HOME_QUERY_RESULT, PROJECTS_QUERY_RESULT, SITE_SETTINGS_QUERY_RESULT, WORK_QUERY_RESULT} from '@/lib/sanity/types'
import {sanityFetch} from '@/lib/sanity/live'
import {ABOUT_QUERY, CONTACT_QUERY, FRAMES_PAGE_QUERY, FRAMES_QUERY, HOME_QUERY, PROJECTS_QUERY, PROJECT_SLUGS_QUERY, SITE_SETTINGS_QUERY, WORK_QUERY} from '@/lib/sanity/queries'
import {toAboutVM, toContactVM, toFramesPageVM, toFramesVM, toHomeVM, toWorkVM} from '@/lib/viewmodel/pagesContent'
import {deriveProjects} from '@/lib/viewmodel/projects'
import {toSiteSettingsVM} from '@/lib/viewmodel/site'

export async function getSiteSettings() {
  const {data} = await sanityFetch({query: SITE_SETTINGS_QUERY})
  return toSiteSettingsVM(data as SITE_SETTINGS_QUERY_RESULT)
}
export async function getHome() {
  const {data} = await sanityFetch({query: HOME_QUERY})
  return toHomeVM(data as HOME_QUERY_RESULT)
}
export async function getWork() {
  const {data} = await sanityFetch({query: WORK_QUERY})
  return toWorkVM(data as WORK_QUERY_RESULT)
}
export async function getFramesPage() {
  const {data} = await sanityFetch({query: FRAMES_PAGE_QUERY})
  return toFramesPageVM(data as FRAMES_PAGE_QUERY_RESULT)
}
export async function getFrames() {
  const [{data}, page] = await Promise.all([sanityFetch({query: FRAMES_QUERY}), getFramesPage()])
  return toFramesVM(data as unknown as FRAMES_QUERY_RESULT, page)
}
export async function getAbout() {
  const {data} = await sanityFetch({query: ABOUT_QUERY})
  return toAboutVM(data as ABOUT_QUERY_RESULT)
}
export async function getContact() {
  const {data} = await sanityFetch({query: CONTACT_QUERY})
  return toContactVM(data as CONTACT_QUERY_RESULT)
}
export async function getProjects() {
  const {data} = await sanityFetch({query: PROJECTS_QUERY})
  return deriveProjects(data as unknown as PROJECTS_QUERY_RESULT)
}
/** For generateStaticParams: published only, no stega. */
export async function getProjectSlugs() {
  const {data} = await sanityFetch({query: PROJECT_SLUGS_QUERY, perspective: 'published', stega: false})
  return data.flatMap((d) => (d.slug ? [{slug: d.slug}] : []))
}
