import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import type {HomeVM} from '@/lib/viewmodel/pagesContent'
import styles from './Explore.module.css'

export function Explore({explore}: {explore: HomeVM['explore']}) {
  return (
    <section className={styles.section}>
      <div data-reveal="1" className={styles.head}>
        <span className={styles.script}>{explore.script}</span>
        <h2 className={styles.heading}>{explore.heading}</h2>
      </div>
      <div className={styles.grid}>
        {explore.cards.map((c, i) => (
          <Link key={`${c.href}-${i}`} href={c.href} data-reveal="1" className={`${styles.card} hoverLift asButton`}>
            <div className={styles.cardImage}>
              {c.image && <SanityImage image={c.image} sizes="(max-width: 700px) 100vw, (max-width: 1040px) 50vw, (max-width: 1500px) 33vw, 460px" />}
            </div>
            <div className={styles.cardMeta}>
              <span className={styles.cardLabel}>{c.label}</span>
              <span className={styles.cardSub}>{c.sub} →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
