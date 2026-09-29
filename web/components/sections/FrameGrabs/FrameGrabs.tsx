// web/components/sections/FrameGrabs/FrameGrabs.tsx
import {SanityImage} from '@/components/media/SanityImage'
import type {ImageVM} from '@/lib/viewmodel/types'
import styles from './FrameGrabs.module.css'

type Props = {grabs: ImageVM[]; script: string; heading: string; title: string}

export function FrameGrabs({grabs, script, heading, title}: Props) {
  if (grabs.length === 0) return null
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.script}>{script}</span>
          <h2 className={styles.heading}>{heading}</h2>
        </div>
        <div className={styles.grid}>
          {grabs.map((g, i) => (
            <div key={g.assetId + i} data-reveal="1" className={styles.grab}>
              <SanityImage image={{...g, alt: g.alt || `Frame grab ${String(i + 1).padStart(2, '0')} from ${title}`}} sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
