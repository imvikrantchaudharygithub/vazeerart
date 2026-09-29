import {SanityImage} from '@/components/media/SanityImage'
import type {FramesPageVM, FrameVM} from '@/lib/viewmodel/pagesContent'
import styles from './FramesGrid.module.css'

export function FramesGrid({page, frames}: {page: FramesPageVM; frames: FrameVM[]}) {
  return (
    <main className={styles.main}>
      <div data-reveal="1" className={styles.head}>
        <span className={styles.script}>{page.script}</span>
        <h1 className={styles.heading}>{page.heading}</h1>
        <a href={page.linkUrl} target="_blank" rel="noreferrer" className={styles.link}>{page.linkLabel}</a>
      </div>
      <div className={styles.columns}>
        {frames.map((f) => {
          const tile = (
            <div data-reveal="1" data-testid="frame" data-ratio={f.ratio} className={styles.frame}>
              <SanityImage image={{...f.image, alt: f.image.alt || f.label}} sizes="(max-width: 600px) 100vw, 280px" />
            </div>
          )
          return f.instagramUrl ? (
            <a key={f.id} href={f.instagramUrl} target="_blank" rel="noreferrer" className={styles.frameLink} aria-label={f.label}>{tile}</a>
          ) : (
            <div key={f.id}>{tile}</div>
          )
        })}
      </div>
    </main>
  )
}
