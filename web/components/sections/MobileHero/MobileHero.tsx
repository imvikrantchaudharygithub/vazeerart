// web/components/sections/MobileHero/MobileHero.tsx
import type {CSSProperties} from 'react'
import {createDataAttribute, stegaClean} from 'next-sanity'
import {MediaSlot} from '@/components/media/MediaSlot'
import {SanityImage} from '@/components/media/SanityImage'
import {env} from '@/lib/env'
import {MOBILE_HERO} from '@/lib/motion/constants'
import {chunkWord, coverRect, lensFontScale} from '@/lib/motion/lensSplit'
import type {ImageVM} from '@/lib/viewmodel/types'
import type {HomeVM} from '@/lib/viewmodel/pagesContent'
import {LensSplitController} from './LensSplitController'
import styles from './MobileHero.module.css'

/** Width / height of the image as the CDN serves it (after the editor's crop). */
export function effectiveAspect(image: ImageVM): number {
  const c = image.crop
  const w = image.width * (1 - (c?.left ?? 0) - (c?.right ?? 0))
  const h = image.height * (1 - (c?.top ?? 0) - (c?.bottom ?? 0))
  return w > 0 && h > 0 ? w / h : 1.5
}

const rowStyle = (i: number, fit: number) => ({'--row': i, '--fit': fit}) as CSSProperties

/** Phone-only home hero: the export's variant 3a, lens first, morphing to the split layout on scroll. */
export function MobileHero({hero}: {hero: HomeVM['hero']}) {
  const pieces = chunkWord(stegaClean(hero.word))
  const fit = lensFontScale(pieces)
  const image = hero.mainImage
  const aspect = image ? effectiveAspect(image) : 1.5
  const focus = image?.hotspot ? {x: image.hotspot.x, y: image.hotspot.y} : {x: 0.5, y: 0.5}
  // The photo cover is laid out for the export's 390 × 480 split box and scaled down into the 316 lens.
  const base = coverRect(390, 480, aspect, focus)
  const zoom = coverRect(316, 316, aspect, focus).h / base.h
  const coverStyle: CSSProperties = {
    left: `calc(${base.x} * var(--u))`, top: `calc(${base.y} * var(--u))`,
    width: `calc(${base.w} * var(--u))`, height: `calc(${base.h} * var(--u))`,
    transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
    transform: `scale(${zoom / (316 / 390)}, ${zoom / (316 / 480)})`,
  }
  const wordAttr = createDataAttribute({
    baseUrl: env.studioUrl, projectId: env.projectId, dataset: env.dataset,
    id: 'homePage', type: 'homePage', path: 'hero.word',
  }).toString()

  return (
    <section className={styles.root} data-lens-root="">
      <div className={styles.stage} data-lens="stage">
        <div className={styles.safe} data-lens="safe">
          <div className={styles.du}>
            <div className={styles.amber} data-lens="amber" />
            <div aria-hidden="true" data-sanity={wordAttr}>
              {pieces.map((piece, i) => (
                <div key={i} className={styles.row} style={rowStyle(i, fit)} data-hero-anim="">
                  <span className={styles.piece} data-lens={`w${i}`}>{piece}</span>
                </div>
              ))}
            </div>
            <div className={styles.lensWrap} data-hero-anim="">
              <div className={styles.ring} data-lens="ring" />
              <div className={styles.photo} data-lens="photo">
                <div className={styles.cover} data-lens="cover" style={coverStyle}>
                  {image && <SanityImage image={image} sizes="(max-width: 743px) 185vw, 1px" preloadMedia={MOBILE_HERO.QUERY} className={styles.kb} />}
                </div>
                <div className={styles.grad} data-lens="grad" />
              </div>
            </div>
            <div className={styles.thumb} data-lens="thumb">
              {hero.polaroidLeft?.kind === 'video'
                // Not autoplay: a hidden autoplay video still downloads on desktop. The controller plays it on phones.
                ? <video className={styles.thumbVideo} src={hero.polaroidLeft.url} muted loop playsInline preload="none" aria-hidden="true" data-lens="thumbVideo" />
                : <MediaSlot media={hero.polaroidLeft} sizes="(max-width: 800px) 120px, 15vw" />}
            </div>
            <div aria-hidden="true">
              {pieces.map((piece, i) => (
                <div key={i} className={styles.row} style={rowStyle(i, fit)} data-hero-anim="">
                  <span className={`${styles.piece} ${styles.outline}`} data-lens={`o${i}`}>{piece}</span>
                </div>
              ))}
            </div>
            <div className={styles.artWrap} data-hero-anim="" aria-hidden="true">
              <span className={styles.art} data-lens="art">{hero.script}</span>
            </div>
          </div>
        </div>
      </div>
      <LensSplitController aspect={aspect} focusX={focus.x} focusY={focus.y} lensScale={fit} content={`${pieces.join('|')}|${stegaClean(hero.script)}`} />
    </section>
  )
}
