// web/components/sections/UpNext/UpNext.tsx
import Link from 'next/link'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import styles from './UpNext.module.css'

export function UpNext({next, script}: {next: ProjectVM; script: string}) {
  return (
    <section className={styles.section}>
      <Link href={`/work/${next.slug}`} className={`${styles.link} hoverAmber asButton`}>
        <span className={styles.script}>{script}</span>
        <span className={styles.title}>{next.title} →</span>
      </Link>
    </section>
  )
}
