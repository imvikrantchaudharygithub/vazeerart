import Link from 'next/link'
import {MediaSlot} from '@/components/media/MediaSlot'
import {SanityImage} from '@/components/media/SanityImage'
import type {AboutVM} from '@/lib/viewmodel/pagesContent'
import styles from './AboutHero.module.css'

export function AboutHero({hero}: {hero: AboutVM['hero']}) {
  return (
    <section className={styles.section}>
      <div data-reveal="1" className={styles.collage}>
        <div className={styles.portrait}>{hero.portrait && <SanityImage image={hero.portrait} sizes="(max-width: 660px) 72vw, 475px" priority />}</div>
        <div className={styles.polaroid}><MediaSlot media={hero.polaroid} sizes="(max-width: 660px) 46vw, 300px" /></div>
      </div>
      <div data-reveal="1" className={styles.text}>
        <span className={styles.script}>{hero.script}</span>
        <h1 className={styles.heading}>{hero.heading}</h1>
        <p className={styles.body}>{hero.body}</p>
        <Link href="/contact" className={`${styles.cta} hoverAmber asButton`}>{hero.ctaLabel}</Link>
      </div>
    </section>
  )
}
