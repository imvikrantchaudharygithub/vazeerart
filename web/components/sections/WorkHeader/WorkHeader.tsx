import {Suspense} from 'react'
import type {WorkVM} from '@/lib/viewmodel/pagesContent'
import {WorkFilters} from './WorkFilters'
import styles from './WorkHeader.module.css'

export function WorkHeader({work}: {work: WorkVM}) {
  return (
    <section className={styles.section}>
      <div className={styles.titleWrap}>
        <h1 className={styles.title}>{work.title}</h1>
        <span className={styles.script}>{work.script}</span>
      </div>
      <div className={styles.side}>
        <p className={styles.intro}>{work.intro}</p>
        <Suspense fallback={<div className={styles.filters} />}>
          <WorkFilters labels={work.filters} />
        </Suspense>
      </div>
    </section>
  )
}
