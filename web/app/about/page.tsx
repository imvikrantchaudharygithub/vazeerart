import {AboutHero} from '@/components/sections/AboutHero/AboutHero'
import {Credits} from '@/components/sections/Credits/Credits'
import {Finale} from '@/components/sections/Finale/Finale'
import {Statement} from '@/components/sections/Statement/Statement'
import {PersonJsonLd} from '@/components/seo/PersonJsonLd'
import {getAbout, getProjects, getSiteSettings} from '@/lib/data'
import {env} from '@/lib/env'
import {buildMetadata} from '@/lib/seo'

export async function generateMetadata() {
  const [about, settings] = await Promise.all([getAbout(), getSiteSettings()])
  return buildMetadata({seo: about.seo, fallback: settings.seo, path: '/about', siteUrl: env.siteUrl, title: about.hero.heading, imageFallback: about.hero.portrait})
}

export default async function AboutPage() {
  const [about, projects, settings] = await Promise.all([getAbout(), getProjects(), getSiteSettings()])
  return (
    <main className="pagein">
      <PersonJsonLd settings={settings} name={about.hero.heading} jobTitle={about.statement.headingAccent} />
      <AboutHero hero={about.hero} />
      <Statement statement={about.statement} />
      <Credits credits={about.credits} projects={projects} />
      <Finale finale={about.finale} />
    </main>
  )
}
