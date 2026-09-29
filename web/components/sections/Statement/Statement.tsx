import type {AboutVM} from '@/lib/viewmodel/pagesContent'
import styles from './Statement.module.css'

export function Statement({statement}: {statement: AboutVM['statement']}) {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>
          {statement.headingPlain} <span className={styles.accent}>{statement.headingAccent}</span>
        </h2>
        <div className={styles.paragraphs}>
          {statement.paragraphs.map((text, i) => <p key={i} className={styles.p}>{text}</p>)}
          <span className={styles.aside}>{statement.aside}</span>
        </div>
      </div>
    </section>
  )
}
