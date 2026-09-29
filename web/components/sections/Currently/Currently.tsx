import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import type {HomeVM} from '@/lib/viewmodel/pagesContent'
import styles from './Currently.module.css'

export function Currently({currently}: {currently: HomeVM['currently']}) {
  return (
    <section className={styles.section}>
      <div className={styles.bg}>
        <div className={styles.kenburns} data-motion="loop">
          {currently.bgImage && <SanityImage image={currently.bgImage} sizes="100vw" />}
        </div>
      </div>
      <div data-reveal="1" className={styles.card}>
        <span className={styles.script}>{currently.script}</span>
        <h3 className={styles.heading}>{currently.heading}</h3>
        <p className={styles.body}>{currently.body}</p>
        <Link href="/contact" className={`${styles.cta} hoverBgRust asButton`}>{currently.ctaLabel}</Link>
      </div>
    </section>
  )
}
