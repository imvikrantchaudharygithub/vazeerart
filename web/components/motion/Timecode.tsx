// web/components/motion/Timecode.tsx
'use client'

import {useEffect} from 'react'
import {TIMECODE} from '@/lib/motion/constants'
import {formatTimecode} from '@/lib/motion/timecode'

/**
 * Prototype setInterval(40ms) writing HH:MM:SS:FF to every [data-tc]. t0 = page load, read from the monotonic
 * performance clock (Date.now() can jump). The existing text node is rewritten in place (characterData), so the tick
 * never produces a childList mutation for RevealObserver's MutationObserver to react to.
 */
export function Timecode() {
  useEffect(() => {
    const t0 = performance.now()
    const id = setInterval(() => {
      const nodes = document.querySelectorAll<HTMLElement>('[data-tc]')
      if (!nodes.length) return
      const txt = formatTimecode(performance.now() - t0)
      nodes.forEach((el) => {
        const n = el.firstChild
        if (n && n.nodeType === Node.TEXT_NODE) n.nodeValue = txt
        else el.textContent = txt
      })
    }, TIMECODE.TICK_MS)
    return () => clearInterval(id)
  }, [])
  return null
}
