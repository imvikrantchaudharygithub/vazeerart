import {Currently} from '@/components/sections/Currently/Currently'
import {Explore} from '@/components/sections/Explore/Explore'
import {Hero} from '@/components/sections/Hero/Hero'
import {Intro} from '@/components/sections/Intro/Intro'
import {Marquee} from '@/components/sections/Marquee/Marquee'
import {ReelsRail} from '@/components/sections/ReelsRail/ReelsRail'
import {getHome, getProjects, getSiteSettings} from '@/lib/data'
import {homeProjects} from '@/lib/viewmodel/projects'

export default async function HomePage() {
  const [home, settings, projects] = await Promise.all([getHome(), getSiteSettings(), getProjects()])
  return (
    <main className="pagein">
      <Hero hero={home.hero} />
      {settings.showMarquee && <Marquee words={settings.marqueeWords} />}
      <Intro intro={home.intro} />
      <ReelsRail reels={home.reels} projects={homeProjects(projects)} />
      <Explore explore={home.explore} />
      <Currently currently={home.currently} />
    </main>
  )
}
