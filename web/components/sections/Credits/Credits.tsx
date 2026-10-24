import {ProjectAnchor} from '@/components/ui/ProjectAnchor'
import {projectDetailPages} from '@/lib/flags'
import type {AboutVM} from '@/lib/viewmodel/pagesContent'
import {projectLink, type ProjectVM} from '@/lib/viewmodel/projects'
import styles from './Credits.module.css'

/** Credit rows open the project page or, while the detail pages are off (lib/flags.ts), its video; credit-only rows never link. */
export function Credits({credits, projects, linkToDetail = projectDetailPages}: {credits: AboutVM['credits']; projects: ProjectVM[]; linkToDetail?: boolean}) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <span className={styles.script}>{credits.script}</span>
          <h2 className={styles.heading}>{credits.heading}</h2>
        </div>
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
          const link = p.creditOnly ? null : projectLink(p, linkToDetail)
          return link ? (
            <ProjectAnchor key={p.id} link={link} data-reveal="1" data-testid="credit-row" className={`${styles.row} hoverAmber asButton`}>{cells}</ProjectAnchor>
          ) : (
            <div key={p.id} data-reveal="1" data-testid="credit-row" className={`${styles.row} ${styles.rowStatic}`}>{cells}</div>
          )
        })}
      </div>
    </section>
  )
}
