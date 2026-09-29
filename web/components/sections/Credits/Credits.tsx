import Link from 'next/link'
import type {AboutVM} from '@/lib/viewmodel/pagesContent'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import styles from './Credits.module.css'

export function Credits({credits, projects}: {credits: AboutVM['credits']; projects: ProjectVM[]}) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <span className={styles.script}>{credits.script}</span>
          <h2 className={styles.heading}>{credits.heading}</h2>
        </div>
        <a href={credits.imdbUrl} target="_blank" rel="noreferrer" className={styles.imdb}>{credits.imdbLabel}</a>
      </div>
      <div className={styles.list}>
        {projects.map((p) => {
          const cells = (
            <>
              <span className={styles.year}>{p.year}</span>
              <span className={styles.title}>{p.title}</span>
              <span className={styles.meta}>{p.formatLower} · {p.roleShort}</span>
            </>
          )
          return p.creditOnly ? (
            <div key={p.id} data-reveal="1" data-testid="credit-row" className={`${styles.row} ${styles.rowStatic}`}>{cells}</div>
          ) : (
            <Link key={p.id} href={`/work/${p.slug}`} data-reveal="1" data-testid="credit-row" className={`${styles.row} hoverAmber asButton`}>{cells}</Link>
          )
        })}
      </div>
    </section>
  )
}
