// web/components/motion/RevealObserver.tsx
'use client'

import {useEffect} from 'react'
import {REVEAL} from '@/lib/motion/constants'
import {revealTransition, shouldSkipReveal} from '@/lib/motion/reveal'

/** Prototype scanReveal(): one observer for the component's lifetime; rescans after mount and after DOM mutations that insert elements (route changes, filters); text-only batches, e.g. the Timecode tick, are ignored. */
export function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          el.style.opacity = '1'
          el.style.translate = '0 0'
          io.unobserve(el)
        }
      },
      {threshold: REVEAL.THRESHOLD},
    )

    const scanAll = () => {
      document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-rv])').forEach((el, i) => {
        el.dataset.rv = '1'
        if (shouldSkipReveal(el.getBoundingClientRect().top, window.innerHeight)) return
        el.style.opacity = '0'
        el.style.translate = `0 ${REVEAL.DISTANCE_PX}px`
        el.style.transition = revealTransition(i)
        io.observe(el)
      })
    }

    const initial = setTimeout(scanAll, REVEAL.INITIAL_SCAN_DELAY_MS)
    let pending = 0
    const mo = new MutationObserver((records) => {
      if (pending) return
      if (!records.some((r) => Array.from(r.addedNodes).some((n) => n.nodeType === Node.ELEMENT_NODE))) return
      pending = requestAnimationFrame(() => { pending = 0; scanAll() })
    })
    mo.observe(document.body, {childList: true, subtree: true})

    return () => {
      clearTimeout(initial)
      if (pending) cancelAnimationFrame(pending)
      mo.disconnect()
      io.disconnect()
    }
  }, [])

  return null
}
