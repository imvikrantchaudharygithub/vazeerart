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
  const dialogRef = useRef<HTMLDivElement>(null)

  // Escape cannot be observed while focus is inside the cross-origin iframe; Close and the backdrop still work.
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('iframe,button:not([disabled])'))
      if (!focusables.length) return
      const index = focusables.indexOf(document.activeElement as HTMLElement)
      e.preventDefault()
      // Focus outside the dialog returns to Close; otherwise step with wrap-around (Shift+Tab on first -> last, Tab on last -> first).
      if (index === -1) closeRef.current?.focus()
      else focusables[(index + (e.shiftKey ? focusables.length - 1 : 1)) % focusables.length].focus()
    }
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
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} className={styles.backdrop} data-testid="lightbox-backdrop" onClick={() => setOpen(false)}>
            <div className={styles.player} data-testid="lightbox-player" onClick={(e) => e.stopPropagation()}>
              <iframe
                className={styles.iframe}
                src={embed.embedUrl}
                title={title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
            <button ref={closeRef} type="button" className={styles.close} aria-label="Close" onClick={() => setOpen(false)}>Close <span aria-hidden="true">✕</span></button>
          </div>,
          document.body,
        )}
    </>
  )
}
