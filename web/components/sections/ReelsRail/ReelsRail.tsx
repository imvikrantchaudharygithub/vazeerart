import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import {projectDetailPages} from '@/lib/flags'
import type {HomeVM} from '@/lib/viewmodel/pagesContent'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import {ReelDrift} from './ReelDrift'
import styles from './ReelsRail.module.css'

type Props = {reels: HomeVM['reels']; projects: ProjectVM[]; linkToDetail?: boolean}

/**
 * Film-strip rail of the home projects. The cards are rendered twice: the second, aria-hidden and inert set is
 * displayed only while ReelDrift runs, so its slow glide can wrap seamlessly (spec §3.3 "Reel drift").
 */
export function ReelsRail({reels, projects, linkToDetail = projectDetailPages}: Props) {
  const card = (p: ProjectVM, clone: boolean) => {
    const key = clone ? `clone-${p.id}` : p.id
    const body = (
      <>
        <div className={styles.cardImage}>
          {p.cover && <SanityImage image={p.cover} sizes="(max-width: 700px) 280px, (max-width: 1500px) 40vw, 600px" />}
        </div>
        <div className={styles.cardMeta}>
          <span className={`${styles.cardTitle}${linkToDetail ? ' hoverAmber' : ''}`}>{p.title}</span>
          <span className={styles.cardSub}>({p.formatLower}, {p.year})</span>
        </div>
      </>
    )
    return linkToDetail ? (
      <Link key={key} href={`/work/${p.slug}`} data-reveal="1" className={`${styles.card} asButton`} tabIndex={clone ? -1 : undefined}>{body}</Link>
    ) : (
      <div key={key} data-reveal="1" data-testid={clone ? undefined : 'reel-card'} className={`${styles.card} ${styles.cardStatic}`}>{body}</div>
    )
  }
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
      <div className={styles.rail} data-reel-rail>
        {projects.map((p) => card(p, false))}
        <div className={styles.clone} data-reel-clone aria-hidden="true" inert>
          {projects.map((p) => card(p, true))}
        </div>
      </div>
      <ReelDrift />
      <div className={styles.sprocketBottom} aria-hidden="true" />
    </section>
  )
}
