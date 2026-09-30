// web/components/sections/MobileHero/LensSplitController.tsx
'use client'

import {useEffect, useRef} from 'react'
import {MOBILE_HERO} from '@/lib/motion/constants'
import {glidePlan, lensSplitFrame, lensSplitGeometry, progressFromScroll, smoothToward, type Geometry} from '@/lib/motion/lensSplit'

type Parts = {
  root: HTMLElement; stage: HTMLElement; safe: HTMLElement; amber: HTMLElement; ring: HTMLElement; photo: HTMLElement
  cover: HTMLElement; grad: HTMLElement; thumb: HTMLElement; art: HTMLElement; words: HTMLElement[]; outlines: HTMLElement[]
}

function findParts(root: HTMLElement): Parts | null {
  const one = (k: string) => root.querySelector<HTMLElement>(`[data-lens="${k}"]`)
  const many = (prefix: string) => [0, 1, 2].map((i) => one(`${prefix}${i}`)).filter((e): e is HTMLElement => !!e)
  const [stage, safe, amber, ring, photo, cover, grad, thumb, art] = ['stage', 'safe', 'amber', 'ring', 'photo', 'cover', 'grad', 'thumb', 'art'].map(one)
  if (!stage || !safe || !amber || !ring || !photo || !cover || !grad || !thumb || !art) return null
  return {root, stage, safe, amber, ring, photo, cover, grad, thumb, art, words: many('w'), outlines: many('o')}
}

function paint(p: Parts, g: Geometry, progress: number) {
  const f = lensSplitFrame(1 - progress, g)
  p.photo.style.transform = `translate(${f.photo.tx}px,${f.photo.ty}px) scale(${f.photo.sx},${f.photo.sy})`
  p.photo.style.borderRadius = `${f.photo.rx}px / ${f.photo.ry}px`
  p.cover.style.transform = `scale(${f.cover.kx},${f.cover.ky})`
  p.ring.style.transform = `translate(${f.ring.tx}px,${f.ring.ty}px) scale(${f.ring.sx},${f.ring.sy})`
  p.ring.style.boxShadow = f.ring.shadow
  p.grad.style.opacity = String(f.grad)
  p.amber.style.transform = `translateY(${f.amber * 100}%)`
  f.words.forEach((w, i) => {
    const t = `translate(${w.tx}px,${w.ty}px) scale(${w.k})`
    if (p.words[i]) { p.words[i].style.transform = t; p.words[i].style.color = f.wordColor }
    if (p.outlines[i]) { p.outlines[i].style.transform = t; p.outlines[i].style.opacity = String(f.outline) }
  })
  p.art.style.transform = `translate(${f.art.tx}px,${f.art.ty}px) rotate(${f.art.r}deg) scale(${f.art.k})`
  p.art.style.color = f.artColor
  p.thumb.style.transform = `translate(${f.thumb.tx}px,${f.thumb.ty}px) rotate(${f.thumb.r}deg) scale(${f.thumb.k})`
  p.thumb.style.opacity = String(f.thumb.opacity)
  // Only once photo + amber cover the whole stage, so the swap is invisible (iOS 26 samples this colour under its toolbar).
  p.stage.toggleAttribute('data-amber-bottom', f.amber < 0.001)
}

type Props = {aspect: number; focusX: number; focusY: number; lensScale: number; content: string}

/**
 * Scroll-driven lens → split morph for MobileHero. Progress follows the scroll over the first MORPH_SVH of the
 * runway (smoothed). When scrolling stops part-way, the page glides to the end in the last direction with the
 * morph running linearly at the export's pace. Inert under reduced motion, off phones and while the leader is on.
 * Publishes data-hero-state="lens|moving|split" on the section (tests wait on it).
 */
export function LensSplitController({aspect, focusX, focusY, lensScale, content}: Props) {
  // Survives SanityLive refreshes and Strict Mode re-runs: the morph never snaps back or replays.
  const progress = useRef<number | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const root = document.querySelector<HTMLElement>('[data-lens-root]')
    const parts = root && findParts(root)
    if (!root || !parts) return
    const video = root.querySelector<HTMLVideoElement>('[data-lens="thumbVideo"]')
    const phone = window.matchMedia(MOBILE_HERO.QUERY)
    let geo: Geometry | null = null
    let raf = 0
    let last = 0
    let visible = true
    let touching = false
    let direction = 1
    let lastY = window.scrollY
    let idle = 0
    let rest = 0
    let glide: {p0: number; to: 0 | 1; t0: number; runwayTop: number; morph: number} | null = null

    const morphPx = () => (MOBILE_HERO.MORPH_SVH / 100) * (parts.safe.getBoundingClientRect().height + MOBILE_HERO.HEADER_PX)
    const scrolled = () => MOBILE_HERO.HEADER_PX - root.getBoundingClientRect().top
    const leaderOn = () => document.documentElement.dataset.leader === 'on'
    const target = () => (leaderOn() ? 0 : progressFromScroll(scrolled(), morphPx()))

    const setState = (p: number) => {
      const state = p <= 0 ? 'lens' : p >= 1 ? 'split' : 'moving'
      if (root.dataset.heroState !== state) root.dataset.heroState = state
    }
    const moving = (on: boolean) => {
      window.clearTimeout(rest)
      if (on) parts.stage.setAttribute('data-moving', '')
      else rest = window.setTimeout(() => parts.stage.removeAttribute('data-moving'), 250)
    }

    const measure = () => {
      if (!phone.matches) { geo = null; video?.pause(); return }
      const box = parts.safe.getBoundingClientRect()
      const u = Math.min(box.width / 390, box.height / (MOBILE_HERO.Y1 - MOBILE_HERO.Y0))
      if (!(u > 0)) return
      // Fractional layout widths (transforms cleared for the read, re-applied below before any paint).
      const widths = parts.words.map((w) => { const t = w.style.transform; w.style.transform = 'none'; const width = w.getBoundingClientRect().width; w.style.transform = t; return width / u })
      geo = lensSplitGeometry({
        W: box.width, Hs: box.height, stageH: parts.stage.getBoundingClientRect().height,
        widths, artWidth: parts.art.offsetWidth / u, aspect, focus: {x: focusX, y: focusY}, lensScale,
      })
      if (progress.current === null) progress.current = target()
      paint(parts, geo, progress.current)
      setState(progress.current)
      if (video && visible) void video.play().catch(() => undefined)
      schedule()
    }

    const tick = (now: number) => {
      raf = 0
      if (!geo) return
      const dt = last ? now - last : 16
      last = now
      let current: number
      if (glide) {
        // The export's leg: t moves linearly in time; the page scroll follows the morph.
        const dir = glide.to === 1 ? 1 : -1
        current = Math.min(1, Math.max(0, glide.p0 + (dir * (now - glide.t0)) / MOBILE_HERO.GLIDE_FULL_MS))
        window.scrollTo({top: glide.runwayTop + current * glide.morph, behavior: 'instant'})
        lastY = window.scrollY
        if (current === glide.to) glide = null
      } else {
        current = smoothToward(progress.current ?? 0, target(), dt, MOBILE_HERO.SMOOTH_MS)
      }
      progress.current = current
      paint(parts, geo, current)
      setState(current)
      if (glide || current !== target()) { moving(true); raf = requestAnimationFrame(tick) }
      else { last = 0; moving(false) }
    }
    function schedule() { if (!raf && visible && geo) raf = requestAnimationFrame(tick) }

    const startGlide = () => {
      if (touching || glide || !geo || leaderOn()) return
      const px = morphPx()
      const now = progressFromScroll(scrolled(), px)
      const plan = glidePlan(now, direction, MOBILE_HERO.GLIDE_FULL_MS)
      if (!plan) return
      glide = {p0: progress.current ?? now, to: plan.to, t0: performance.now(), runwayTop: window.scrollY - scrolled(), morph: px}
      schedule()
    }
    const armIdle = () => { window.clearTimeout(idle); idle = window.setTimeout(startGlide, MOBILE_HERO.IDLE_MS) }
    const onScroll = () => {
      const y = window.scrollY
      if (!glide && Math.abs(y - lastY) > 0.5) {
        direction = y > lastY ? 1 : -1
        armIdle()
      }
      lastY = y
      schedule()
    }
    const cancelGlide = () => { if (glide) { glide = null; schedule() } }
    const onTouchStart = () => { touching = true; window.clearTimeout(idle); cancelGlide() }
    const onTouchEnd = () => { touching = false; armIdle() }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (video) { if (visible && geo) void video.play().catch(() => undefined); else video.pause() }
      schedule()
    })
    io.observe(root)
    const ro = new ResizeObserver(() => measure())
    ro.observe(parts.safe)
    const leader = new MutationObserver(() => schedule())
    leader.observe(document.documentElement, {attributes: true, attributeFilter: ['data-leader']})
    const opts = {passive: true} as const
    window.addEventListener('scroll', onScroll, opts)
    window.addEventListener('touchstart', onTouchStart, opts)
    window.addEventListener('touchend', onTouchEnd, opts)
    window.addEventListener('touchcancel', onTouchEnd, opts)
    window.addEventListener('wheel', cancelGlide, opts)
    window.addEventListener('pointerdown', cancelGlide, opts)
    window.addEventListener('keydown', cancelGlide)
    phone.addEventListener('change', measure)
    const fonts = document.fonts
    fonts?.addEventListener?.('loadingdone', measure)
    const family = (el: HTMLElement) => getComputedStyle(el).fontFamily
    Promise.all([
      fonts?.load?.(`250px ${family(parts.words[0] ?? parts.art)}`),
      fonts?.load?.(`124px ${family(parts.art)}`),
    ]).catch(() => undefined).then(measure)
    measure()

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(idle)
      window.clearTimeout(rest)
      io.disconnect(); ro.disconnect(); leader.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('wheel', cancelGlide)
      window.removeEventListener('pointerdown', cancelGlide)
      window.removeEventListener('keydown', cancelGlide)
      phone.removeEventListener('change', measure)
      fonts?.removeEventListener?.('loadingdone', measure)
    }
  }, [aspect, focusX, focusY, lensScale, content])

  return null
}
