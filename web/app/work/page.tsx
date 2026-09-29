import {Suspense} from 'react'
import {ProjectList} from '@/components/sections/ProjectList/ProjectList'
import {ProjectListFromSearch} from '@/components/sections/ProjectList/ProjectListFromSearch'
import {Showreel} from '@/components/sections/Showreel/Showreel'
import {Skills} from '@/components/sections/Skills/Skills'
import {WorkHeader} from '@/components/sections/WorkHeader/WorkHeader'
import {getProjects, getSiteSettings, getWork} from '@/lib/data'
import {env} from '@/lib/env'
import {buildMetadata} from '@/lib/seo'
import {pageProjects, showreelOrderNote, toProjectCard} from '@/lib/viewmodel/projects'

export async function generateMetadata() {
  const [work, settings] = await Promise.all([getWork(), getSiteSettings()])
  return buildMetadata({seo: work.seo, fallback: settings.seo, path: '/work', siteUrl: env.siteUrl, title: `${work.title} ${work.script}`, imageFallback: work.showreel.poster})
}

export default async function WorkPage() {
  const [work, projects] = await Promise.all([getWork(), getProjects()])
  const pages = pageProjects(projects)
  const cards = pages.map(toProjectCard)
  const orderNote = showreelOrderNote(pages, work.showreel.orderNotePrefix, work.showreel.orderNoteOverride)
  return (
    <main className="pagein">
      <WorkHeader work={work} />
      <Showreel showreel={work.showreel} orderNote={orderNote} />
      <Suspense fallback={<ProjectList projects={cards} filter="all" numberPrefix={work.numberPrefix} cta={work.projectCta} />}>
        <ProjectListFromSearch projects={cards} numberPrefix={work.numberPrefix} cta={work.projectCta} />
      </Suspense>
      <Skills skills={work.skills} />
    </main>
  )
}
