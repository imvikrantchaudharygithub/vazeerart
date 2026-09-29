import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import {alternateOrder, filterProjects, type ProjectCardVM, type WorkFilter} from '@/lib/viewmodel/projects'
import styles from './ProjectList.module.css'

type Props = {projects: ProjectCardVM[]; filter: WorkFilter; numberPrefix: string; cta: string}

export function ProjectList({projects, filter, numberPrefix, cta}: Props) {
  const visible = filterProjects(projects, filter)
  const orders = alternateOrder(visible.length)
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {visible.map((p, i) => (
          <article key={p.id} data-reveal="1" className={styles.article}>
            <Link href={`/work/${p.slug}`} className={`${styles.cover} asButton`} data-order={String(orders[i])} aria-label={`Open ${p.title}`}>
              {p.cover && <SanityImage image={p.cover} sizes="(max-width: 800px) 100vw, 50vw" />}
            </Link>
            <div className={styles.text}>
              <span className={styles.number}>{numberPrefix} {p.n}</span>
              <h3 className={styles.title}>{p.title}</h3>
              <span className={styles.sub}>({p.formatLower}, {p.year})</span>
              <span className={styles.role}>{p.role}</span>
              <Link href={`/work/${p.slug}`} className={`${styles.cta} hoverRust asButton`}>{cta}</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
