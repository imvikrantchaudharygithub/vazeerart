import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import type {HomeVM} from '@/lib/viewmodel/pagesContent'
import styles from './Intro.module.css'

export function Intro({intro}: {intro: HomeVM['intro']}) {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div data-reveal="1" className={styles.collage}>
          <div className={styles.imageA}>{intro.imageA && <SanityImage image={intro.imageA} sizes="(max-width: 640px) 68vw, 435px" />}</div>
          <div className={styles.imageB}>{intro.imageB && <SanityImage image={intro.imageB} sizes="(max-width: 640px) 50vw, 320px" />}</div>
        </div>
        <div data-reveal="1" className={styles.text}>
          <span className={styles.script}>{intro.script}</span>
          <h2 className={styles.heading}>{intro.heading}</h2>
          <span className={styles.subline}>{intro.subline}</span>
          <p className={styles.body}>{intro.body}</p>
          <Link href="/about" className={`${styles.cta} hoverRust asButton`}>{intro.ctaLabel}</Link>
        </div>
      </div>
    </section>
  )
}
