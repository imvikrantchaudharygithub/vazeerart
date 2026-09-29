// web/app/work/[slug]/page.tsx
import {notFound} from 'next/navigation'
import {FrameGrabs} from '@/components/sections/FrameGrabs/FrameGrabs'
import {ProjectHero} from '@/components/sections/ProjectHero/ProjectHero'
import {UpNext} from '@/components/sections/UpNext/UpNext'
import {getProjectSlugs, getProjects, getSiteSettings, getWork} from '@/lib/data'
import {nextProject, pageProjects} from '@/lib/viewmodel/projects'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  return getProjectSlugs()
}

export default async function ProjectPage({params}: Props) {
  const {slug} = await params
  const [work, projects, settings] = await Promise.all([getWork(), getProjects(), getSiteSettings()])
  const pages = pageProjects(projects)
  const project = pages.find((p) => p.slug === slug)
  if (!project) notFound()
  const next = nextProject(pages, slug)
  const labels = work.projectPage

  return (
    <main className="pagein">
      <ProjectHero project={project} labels={labels} showRec={settings.showRec} />
      <FrameGrabs grabs={project.frameGrabs} script={labels.grabsScript} heading={labels.grabsHeading} title={project.title} />
      {next && next.slug !== project.slug && <UpNext next={next} script={labels.upNextScript} />}
    </main>
  )
}
