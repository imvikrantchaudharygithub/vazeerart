import {SanityImage} from '@/components/media/SanityImage'
import {VideoTrigger} from '@/components/motion/VideoTrigger'
import {parseVideoUrl} from '@/lib/video'
import type {WorkVM} from '@/lib/viewmodel/pagesContent'
import styles from './Showreel.module.css'

export function Showreel({showreel, orderNote}: {showreel: WorkVM['showreel']; orderNote: string}) {
  const embed = parseVideoUrl(showreel.videoUrl)
  return (
    <section className={styles.section}>
      <div className={styles.poster}>
        <div className={styles.bg}>
          <div className={styles.kenburns} data-motion="loop">
            {showreel.poster && <SanityImage image={showreel.poster} sizes="(max-width: 1500px) 100vw, 1400px" priority />}
          </div>
        </div>
        {embed && <VideoTrigger embed={embed} title={showreel.label} />}
      </div>
      <div className={styles.meta}>
        <span className={styles.label}>{showreel.label}</span>
        <span className={styles.note}>{orderNote}</span>
      </div>
    </section>
  )
}
