import {MediaSlot} from '@/components/media/MediaSlot'
import {SanityImage} from '@/components/media/SanityImage'
import {DESKTOP_HERO_MEDIA} from '@/lib/motion/constants'
import type {HomeVM} from '@/lib/viewmodel/pagesContent'
import styles from './Hero.module.css'

export function Hero({hero}: {hero: HomeVM['hero']}) {
  return (
    <section className={styles.section}>
      <div data-depth="0.2" data-scroll="0.1" className={styles.layerGlow}>
        <div className={styles.glow} data-hero-anim="" />
      </div>
      <div data-depth="0.4" data-scroll="0.35" className={styles.layerWord}>
        <div className={styles.word} data-hero-anim="">{hero.word}</div>
      </div>
      <div data-depth="1" data-scroll="-0.12" className={styles.layerFrame}>
        <div className={styles.frame} data-hero-anim="">
          <div className={styles.kenburns} data-motion="loop">
            {hero.mainImage && <SanityImage image={hero.mainImage} sizes="(max-width: 1255px) 94vw, 1180px" preloadMedia={DESKTOP_HERO_MEDIA} />}
          </div>
        </div>
      </div>
      <div data-depth="0.4" data-scroll="0.35" className={styles.layerStroke}>
        <div aria-hidden="true" className={styles.stroke} data-hero-anim="">
          <span className={styles.strokeInner}>
            {hero.word}
            <span className={styles.script} data-hero-anim="">{hero.script}</span>
          </span>
        </div>
      </div>
      <div data-depth="2" data-scroll="-0.45" className={styles.layerPolaroidL}>
        <div className={styles.polaroidL} data-hero-anim="">
          <MediaSlot media={hero.polaroidLeft} sizes="(max-width: 800px) 120px, 15vw" />
        </div>
      </div>
      <div data-depth="1.6" data-scroll="-0.25" className={styles.layerPolaroidR}>
        <div className={styles.polaroidR} data-hero-anim="">
          <MediaSlot media={hero.polaroidRight} sizes="(max-width: 800px) 150px, 19vw" />
        </div>
      </div>
    </section>
  )
}
