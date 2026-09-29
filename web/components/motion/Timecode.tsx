// web/components/motion/Timecode.tsx
'use client'

import {useEffect} from 'react'
import {TIMECODE} from '@/lib/motion/constants'
import {formatTimecode} from '@/lib/motion/timecode'

/** Prototype setInterval(40ms) writing HH:MM:SS:FF to every [data-tc]. t0 = page load. */
export function Timecode() {
  useEffect(() => {
    const t0 = Date.now()
    const id = setInterval(() => {
      const nodes = document.querySelectorAll<HTMLElement>('[data-tc]')
      if (!nodes.length) return
      const txt = formatTimecode(Date.now() - t0)
      nodes.forEach((el) => { el.textContent = txt })
    }, TIMECODE.TICK_MS)
    return () => clearInterval(id)
  }, [])
  return null
}
