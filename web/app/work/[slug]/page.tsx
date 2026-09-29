// web/app/work/[slug]/page.tsx
import {notFound} from 'next/navigation'
import {FrameGrabs} from '@/components/sections/FrameGrabs/FrameGrabs'
import {ProjectHero} from '@/components/sections/ProjectHero/ProjectHero'
import {UpNext} from '@/components/sections/UpNext/UpNext'
import {getProjectSlugs, getProjects, getSiteSettings, getWork} from '@/lib/data'
import {env} from '@/lib/env'
import {buildMetadata} from '@/lib/seo'
import {nextProject, pageProjects} from '@/lib/viewmodel/projects'

type Props = {params: Promise<{slug: string}>}

export async function generateStaticParams() {
  return getProjectSlugs()
}

export async function generateMetadata({params}: Props) {
  const {slug} = await params
  const [projects, settings] = await Promise.all([getProjects(), getSiteSettings()])
  const project = pageProjects(projects).find((p) => p.slug === slug)
  if (!project) return {title: 'Not found'}
  return buildMetadata({seo: project.seo, fallback: settings.seo, path: `/work/${slug}`, siteUrl: env.siteUrl, title: `${project.title} — ${project.format}, ${project.year}`, imageFallback: project.cover})
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
