'use client'

import Link from 'next/link'
import {useSearchParams} from 'next/navigation'
import {WORK_FILTERS, parseWorkFilter, type WorkFilter} from '@/lib/viewmodel/projects'
import styles from './WorkHeader.module.css'

export function WorkFilters({labels}: {labels: Record<WorkFilter, string>}) {
  const active = parseWorkFilter(useSearchParams().get('filter'))
  return (
    <div className={styles.filters}>
      {WORK_FILTERS.map((f) => (
        <Link key={f} href={`/work?filter=${f}`} scroll={false} className={styles.chip} data-active={f === active ? 'true' : 'false'}>
          {labels[f]}
        </Link>
      ))}
    </div>
  )
}
