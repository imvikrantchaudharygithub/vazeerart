import {Suspense} from 'react'
import {ProjectList} from '@/components/sections/ProjectList/ProjectList'
import {ProjectListFromSearch} from '@/components/sections/ProjectList/ProjectListFromSearch'
import {Showreel} from '@/components/sections/Showreel/Showreel'
import {Skills} from '@/components/sections/Skills/Skills'
import {WorkHeader} from '@/components/sections/WorkHeader/WorkHeader'
import {getProjects, getWork} from '@/lib/data'
import {pageProjects, showreelOrderNote} from '@/lib/viewmodel/projects'

export default async function WorkPage() {
  const [work, projects] = await Promise.all([getWork(), getProjects()])
  const pages = pageProjects(projects)
  const orderNote = showreelOrderNote(pages, work.showreel.orderNotePrefix, work.showreel.orderNoteOverride)
  return (
    <main className="pagein">
      <WorkHeader work={work} />
      <Showreel showreel={work.showreel} orderNote={orderNote} />
      <Suspense fallback={<ProjectList projects={pages} filter="all" numberPrefix={work.numberPrefix} cta={work.projectCta} />}>
        <ProjectListFromSearch projects={pages} numberPrefix={work.numberPrefix} cta={work.projectCta} />
      </Suspense>
      <Skills skills={work.skills} />
    </main>
  )
}
