// web/components/motion/ParallaxLoop.tsx
'use client'

import {useEffect} from 'react'
import {PARALLAX} from '@/lib/motion/constants'
import {lerp, parallaxTransform} from '@/lib/motion/parallax'

/** Prototype componentDidMount loop: mouse lerp + capped scroll offset on every [data-depth]. */
export function ParallaxLoop() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let mx = 0, my = 0, cx = 0, cy = 0
    let raf = 0
    const onMove = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth - 0.5
      my = e.clientY / window.innerHeight - 0.5
    }
    const loop = () => {
      cx = lerp(cx, mx, PARALLAX.LERP)
      cy = lerp(cy, my, PARALLAX.LERP)
      const sy = window.scrollY
      document.querySelectorAll<HTMLElement>('[data-depth]').forEach((el) => {
        const d = Number(el.dataset.depth)
        const k = Number(el.dataset.scroll || 0)
        el.style.transform = parallaxTransform(cx, cy, d, k, sy)
      })
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])
  return null
}
