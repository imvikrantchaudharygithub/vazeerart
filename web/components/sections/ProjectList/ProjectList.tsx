import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import {ProjectAnchor} from '@/components/ui/ProjectAnchor'
import {projectDetailPages} from '@/lib/flags'
import {alternateOrder, filterProjects, projectLink, type ProjectCardVM, type WorkFilter} from '@/lib/viewmodel/projects'
import styles from './ProjectList.module.css'

type Props = {projects: ProjectCardVM[]; filter: WorkFilter; numberPrefix: string; cta: string; linkToDetail?: boolean}

/**
 * The /work list. Cover and title open the project page or, while the detail pages are switched off (lib/flags.ts),
 * the project's video on YouTube / Vimeo in a new tab; a project with neither stays static. The CTA
 * ("Watch & view frames") belongs to the detail page and only shows with it.
 */
export function ProjectList({projects, filter, numberPrefix, cta, linkToDetail = projectDetailPages}: Props) {
  const visible = filterProjects(projects, filter)
  const orders = alternateOrder(visible.length)
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {visible.map((p, i) => {
          const cover = p.cover && <SanityImage image={p.cover} sizes="(max-width: 800px) 100vw, 50vw" />
          const link = projectLink(p, linkToDetail)
          const order = String(orders[i])
          return (
            <article key={p.id} data-reveal="1" className={styles.article}>
              {link ? (
                <ProjectAnchor link={link} className={`${styles.cover} asButton`} data-order={order} aria-label={`${link.external ? 'Watch' : 'Open'} ${p.title}`}>
                  {cover}
                </ProjectAnchor>
              ) : (
                <div className={`${styles.cover} ${styles.coverStatic}`} data-order={order} data-testid="project-cover">
                  {cover}
                </div>
              )}
              <div className={styles.text}>
                <span className={styles.number}>{numberPrefix} {p.n}</span>
                <h3 className={styles.title}>
                  {link ? <ProjectAnchor link={link} className={`${styles.titleLink} hoverRust asButton`}>{p.title}</ProjectAnchor> : p.title}
                </h3>
                <span className={styles.sub}>({p.formatLower}, {p.year})</span>
                <span className={styles.role}>{p.role}</span>
                {linkToDetail && <Link href={`/work/${p.slug}`} className={`${styles.cta} hoverRust asButton`}>{cta}</Link>}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
