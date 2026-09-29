// web/components/chrome/PreFooter.tsx
'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {preFooterEntries} from '@/lib/viewmodel/pages'
import type {PageEntryVM} from '@/lib/viewmodel/site'
import styles from './PreFooter.module.css'

export function PreFooter({pages}: {pages: PageEntryVM[]}) {
  const pathname = usePathname()
  const entries = preFooterEntries(pages, pathname)
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {entries.map((e) => (
          <Link key={e.key} href={e.href} data-reveal="1" className={`${styles.card} hoverRust asButton`}>
            <span className={styles.script}>{e.preFooterScript}</span>
            <span className={styles.label}>{e.preFooterLabel}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
