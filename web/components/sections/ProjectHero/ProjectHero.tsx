// web/components/sections/ProjectHero/ProjectHero.tsx
import Link from 'next/link'
import {SanityImage} from '@/components/media/SanityImage'
import {VideoTrigger} from '@/components/motion/VideoTrigger'
import {parseVideoUrl} from '@/lib/video'
import type {WorkVM} from '@/lib/viewmodel/pagesContent'
import type {ProjectVM} from '@/lib/viewmodel/projects'
import styles from './ProjectHero.module.css'

type Props = {project: ProjectVM; labels: WorkVM['projectPage']; showRec: boolean}

export function ProjectHero({project, labels, showRec}: Props) {
  const embed = parseVideoUrl(project.videoUrl)
  return (
    <>
      <section className={styles.head}>
        <Link href="/work" className={`${styles.back} hoverAmber asButton`}>{labels.backLabel}</Link>
        <div className={styles.titleRow}>
          <div className={styles.titleWrap}>
            <span className={styles.reel}>{labels.reelPrefix} {project.n}</span>
            <h1 className={styles.title}>{project.title}</h1>
          </div>
          <span className={styles.sub}>({project.formatLower}, {project.year})</span>
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.cover}>
          <div className={styles.bg}>
            <div className={styles.kenburns} data-motion="loop">
              {project.cover && <SanityImage image={project.cover} sizes="(max-width: 1500px) 100vw, 1400px" priority />}
            </div>
          </div>
          <div className={styles.hud} aria-hidden="true">
            {showRec ? (
              <span className={styles.hudLeft}>
                <span className={styles.rec} data-motion="loop" />
                <span data-tc="1">00:00:00:00</span>
              </span>
            ) : <span />}
            <span>{labels.aspectLabel}</span>
          </div>
          {embed && <VideoTrigger embed={embed} title={project.title} />}
        </div>
        <div className={styles.meta}>
          <div className={styles.cell}><span className={styles.cellLabel}>{labels.roleLabel}</span><span className={styles.cellValue}>{project.role}</span></div>
          <div className={styles.cell}><span className={styles.cellLabel}>{labels.formatLabel}</span><span className={styles.cellValue}>{project.format}</span></div>
          <div className={styles.cell}><span className={styles.cellLabel}>{labels.yearLabel}</span><span className={styles.cellValue}>{project.year}</span></div>
        </div>
      </section>
    </>
  )
}
