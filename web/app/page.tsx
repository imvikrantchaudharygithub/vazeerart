import {Currently} from '@/components/sections/Currently/Currently'
import {Explore} from '@/components/sections/Explore/Explore'
import {Hero} from '@/components/sections/Hero/Hero'
import {Intro} from '@/components/sections/Intro/Intro'
import {Marquee} from '@/components/sections/Marquee/Marquee'
import {MobileHero} from '@/components/sections/MobileHero/MobileHero'
import {ReelsRail} from '@/components/sections/ReelsRail/ReelsRail'
import {getHome, getProjects, getSiteSettings} from '@/lib/data'
import {env} from '@/lib/env'
import {buildMetadata} from '@/lib/seo'
import {homeProjects} from '@/lib/viewmodel/projects'
import styles from './page.module.css'

export async function generateMetadata() {
  const [home, settings] = await Promise.all([getHome(), getSiteSettings()])
  return buildMetadata({seo: home.seo, fallback: settings.seo, path: '/', siteUrl: env.siteUrl, imageFallback: home.hero.mainImage})
}

export default async function HomePage() {
  const [home, settings, projects] = await Promise.all([getHome(), getSiteSettings(), getProjects()])
  return (
    <main className="pagein">
      <h1 className="srOnly">{`${settings.brandWord} ${settings.brandScript}`}</h1>
      <div className={styles.desktopHero}>
        <Hero hero={home.hero} />
      </div>
      <MobileHero hero={home.hero} />
      {settings.showMarquee && <Marquee words={settings.marqueeWords} />}
      <Intro intro={home.intro} />
      <ReelsRail reels={home.reels} projects={homeProjects(projects)} />
      <Explore explore={home.explore} />
      <Currently currently={home.currently} />
    </main>
  )
}
