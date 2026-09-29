import {SanityImage} from '@/components/media/SanityImage'
import type {AboutVM} from '@/lib/viewmodel/pagesContent'
import styles from './Finale.module.css'

export function Finale({finale}: {finale: AboutVM['finale']}) {
  return (
    <section className={styles.section}>
      <div className={styles.bg}>
        <div className={styles.kenburns} data-motion="loop">
          {finale.bgImage && <SanityImage image={finale.bgImage} sizes="100vw" />}
        </div>
      </div>
      <div className={styles.text}>
        <span className={styles.script}>{finale.script}</span>
        <span className={styles.sub}>{finale.sub}</span>
      </div>
    </section>
  )
}
