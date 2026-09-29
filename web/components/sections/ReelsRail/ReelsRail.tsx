import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import type {HomeVM} from '@/lib/viewmodel/pagesContent'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import styles from './ReelsRail.module.css'

export function ReelsRail({reels, projects}: {reels: HomeVM['reels']; projects: ProjectVM[]}) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <span className={styles.script}>{reels.script}</span>
          <h2 className={styles.heading}>{reels.heading}</h2>
        </div>
        <Link href="/work" className={`${styles.cta} hoverAmber asButton`}>{reels.ctaLabel}</Link>
      </div>
      <div className={styles.sprocketTop} aria-hidden="true" />
      <div className={styles.rail}>
        {projects.map((p) => (
          <Link key={p.id} href={`/work/${p.slug}`} data-reveal="1" className={`${styles.card} asButton`}>
            <div className={styles.cardImage}>
              {p.cover && <SanityImage image={p.cover} sizes="(max-width: 700px) 280px, (max-width: 1500px) 40vw, 600px" />}
            </div>
            <div className={styles.cardMeta}>
              <span className={`${styles.cardTitle} hoverAmber`}>{p.title}</span>
              <span className={styles.cardSub}>({p.formatLower}, {p.year})</span>
            </div>
          </Link>
        ))}
      </div>
      <div className={styles.sprocketBottom} aria-hidden="true" />
    </section>
  )
}
