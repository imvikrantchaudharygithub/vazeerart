import {MediaSlot} from '@/components/media/MediaSlot'
import type {WorkVM} from '@/lib/viewmodel/pagesContent'
import styles from './Skills.module.css'

export function Skills({skills}: {skills: WorkVM['skills']}) {
  if (skills.items.length === 0) return null
  return (
    <section className={styles.section}>
      <div data-reveal="1" className={styles.head}>
        <span className={styles.script}>{skills.script}</span>
        <h2 className={styles.heading}>{skills.heading}</h2>
      </div>
      <div className={styles.grid}>
        {skills.items.map((s, i) => (
          <div key={`${s.label}-${i}`} data-reveal="1" className={styles.tile}>
            <div className={styles.frame} style={{transform: `rotate(${s.tilt}deg)`}}>
              <MediaSlot media={s.media} sizes="(max-width: 600px) 100vw, 25vw" />
            </div>
            <span className={styles.label}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
