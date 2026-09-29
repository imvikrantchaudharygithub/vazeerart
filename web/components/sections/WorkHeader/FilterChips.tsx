import Link from 'next/link'
import {WORK_FILTERS, type WorkFilter} from '@/lib/viewmodel/projects'
import styles from './WorkHeader.module.css'

export function FilterChips({labels, active}: {labels: Record<WorkFilter, string>; active: WorkFilter}) {
  return (
    <div className={styles.filters}>
      {WORK_FILTERS.map((f) => (
        <Link key={f} href={`/work?filter=${f}`} scroll={false} className={`${styles.chip} asButton`} data-active={f === active ? 'true' : 'false'} aria-current={f === active ? 'page' : undefined}>
          {labels[f]}
        </Link>
      ))}
    </div>
  )
}
