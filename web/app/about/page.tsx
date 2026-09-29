import {AboutHero} from '@/components/sections/AboutHero/AboutHero'
import {Credits} from '@/components/sections/Credits/Credits'
import {Finale} from '@/components/sections/Finale/Finale'
import {Statement} from '@/components/sections/Statement/Statement'
import {getAbout, getProjects} from '@/lib/data'

export default async function AboutPage() {
  const [about, projects] = await Promise.all([getAbout(), getProjects()])
  return (
    <main className="pagein">
      <AboutHero hero={about.hero} />
      <Statement statement={about.statement} />
      <Credits credits={about.credits} projects={projects} />
      <Finale finale={about.finale} />
    </main>
  )
}
