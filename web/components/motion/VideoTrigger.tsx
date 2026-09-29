// web/components/motion/VideoTrigger.tsx
'use client'

import {useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import type {VideoEmbed} from '@/lib/video'
import styles from './VideoTrigger.module.css'

type Props = {embed: VideoEmbed; title: string}

export function VideoTrigger({embed, title}: Props) {
  const [open, setOpen] = useState(false)
  const playRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      playRef.current?.focus()
    }
  }, [open])

  return (
    <>
      <div className={styles.playWrap}>
        <button ref={playRef} type="button" className={styles.play} data-motion="loop" aria-label={`Play ${title}`} onClick={() => setOpen(true)}>
          <span className={styles.triangle} aria-hidden="true" />
        </button>
      </div>
      {open &&
        createPortal(
          <div className={styles.backdrop} data-testid="lightbox-backdrop" onClick={() => setOpen(false)}>
            <div role="dialog" aria-modal="true" aria-label={title} className={styles.player} data-testid="lightbox-player" onClick={(e) => e.stopPropagation()}>
              <iframe
                className={styles.iframe}
                src={embed.embedUrl}
                title={title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
            <button ref={closeRef} type="button" className={styles.close} onClick={() => setOpen(false)}>Close ✕</button>
          </div>,
          document.body,
        )}
    </>
  )
}
