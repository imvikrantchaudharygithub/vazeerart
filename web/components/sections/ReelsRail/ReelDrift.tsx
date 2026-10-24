// web/components/sections/ReelsRail/ReelDrift.tsx
'use client'

import {useEffect} from 'react'
import {advance, canMove, isUserScroll, needsDrift, normalize, type DriftState} from '@/lib/motion/reelDrift'

/**
 * Very slow film-strip glide for the home reel rail (spec §3.3 "Reel drift"). The rail's own scrollLeft advances
 * at REEL_DRIFT.SPEED_PX_S while the rail is on screen and wraps on the aria-hidden clone set, so the loop is
 * seamless while native swipe, wheel and the scroll reveal keep working. It pauses under the pointer, while a card
 * has focus, and for RESUME_MS after the visitor scrolls the rail themselves; it then resumes from where they left
 * it. Inert under reduced motion and when one set already fits the rail (the clones stay hidden then).
 * Publishes data-drift="on|paused" on the rail; the clone set is displayed only while that attribute is present.
 */
export function ReelDrift() {
  useEffect(() => {
    if (typeof window.matchMedia !== 'function' || typeof IntersectionObserver !== 'function') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rail = document.querySelector<HTMLElement>('[data-reel-rail]')
    const clones = rail?.querySelector<HTMLElement>('[data-reel-clone]')
    const first = rail?.firstElementChild
    const firstClone = clones?.firstElementChild
    if (!rail || !clones || !first || !firstClone || first === clones) return

    const state: DriftState = {visible: false, hovered: false, focused: false, now: 0, lastUserScroll: -Infinity}
    let setWidth = 0
    let pos = 0
    let expected = rail.scrollLeft
    let moving = false
    let last: number | null = null
    let raf = 0

    /** One set's pitch, measured with the clones displayed; drops the drift (and the clones) when the set fits. */
    const measure = () => {
      if (!rail.dataset.drift) rail.dataset.drift = 'paused'
      setWidth = firstClone.getBoundingClientRect().left - first.getBoundingClientRect().left
      if (!needsDrift(setWidth, rail.scrollWidth - rail.clientWidth)) {
        setWidth = 0
        moving = false
        delete rail.dataset.drift
        return
      }
      pos = normalize(rail.scrollLeft, setWidth)
    }

    const frame = (t: number) => {
      raf = 0
      if (!state.visible || !setWidth) return
      const dt = last === null ? 0 : t - last
      last = t
      state.now = t
      if (canMove(state)) {
        if (!moving) {
          moving = true
          pos = normalize(rail.scrollLeft, setWidth)
          rail.dataset.drift = 'on'
        }
        pos = advance(pos, dt, setWidth)
        rail.scrollLeft = pos
        expected = rail.scrollLeft
      } else if (moving) {
        moving = false
        rail.dataset.drift = 'paused'
      }
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (raf || !state.visible || !setWidth) return
      last = null
      raf = requestAnimationFrame(frame)
    }

    const onScroll = () => {
      if (!isUserScroll(rail.scrollLeft, expected)) return
      state.lastUserScroll = performance.now()
      expected = rail.scrollLeft
      if (moving) {
        moving = false
        rail.dataset.drift = 'paused'
      }
    }
    const onEnter = () => { state.hovered = true }
    const onLeave = () => { state.hovered = false }
    const onFocusIn = () => { state.focused = true }
    const onFocusOut = () => { state.focused = false }
    const onResize = () => { measure(); start() }
    const io = new IntersectionObserver(([entry]) => {
      state.visible = entry.isIntersecting
      start()
    })

    measure()
    rail.addEventListener('scroll', onScroll, {passive: true})
    rail.addEventListener('pointerenter', onEnter)
    rail.addEventListener('pointerleave', onLeave)
    rail.addEventListener('focusin', onFocusIn)
    rail.addEventListener('focusout', onFocusOut)
    window.addEventListener('resize', onResize)
    io.observe(rail)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      rail.removeEventListener('scroll', onScroll)
      rail.removeEventListener('pointerenter', onEnter)
      rail.removeEventListener('pointerleave', onLeave)
      rail.removeEventListener('focusin', onFocusIn)
      rail.removeEventListener('focusout', onFocusOut)
      window.removeEventListener('resize', onResize)
      delete rail.dataset.drift
    }
  }, [])
  return null
}
