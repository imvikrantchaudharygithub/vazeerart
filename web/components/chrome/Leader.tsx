// web/components/chrome/Leader.tsx
'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {LEADER} from '@/lib/motion/constants'
import styles from './Leader.module.css'

type Props = {left: string; right: string; skip: string}

export function Leader({left, right, skip}: Props) {
  const [step, setStep] = useState<number>(LEADER.STEPS[0])
  const [out, setOut] = useState(false)
  const [done, setDone] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const end = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    try { sessionStorage.setItem(LEADER.STORAGE_KEY, '1') } catch {}
    document.documentElement.dataset.leader = ''
    setDone(true)
  }, [])

  useEffect(() => {
    if (document.documentElement.dataset.leader !== 'on') {
      setDone(true) // not armed: drop the overlay from the DOM instead of leaving it display:none all session
      return
    }
    timers.current = [
      setTimeout(() => setStep(LEADER.STEPS[1]), LEADER.STEP_MS),
      setTimeout(() => setStep(LEADER.STEPS[2]), LEADER.STEP_MS * 2),
      setTimeout(() => { setOut(true); document.documentElement.dataset.leader = 'out' }, LEADER.OUT_AT_MS),
      setTimeout(end, LEADER.END_AT_MS),
    ]
    return () => timers.current.forEach(clearTimeout)
  }, [end])

  if (done) return null

  return (
    <div className={styles.overlay} data-leader-overlay="" data-out={out ? 'true' : 'false'} data-testid="leader">
      <div className={styles.hline} aria-hidden="true" />
      <div className={styles.vline} aria-hidden="true" />
      <div className={styles.ring} aria-hidden="true">
        <div className={styles.spinner} />
        <div className={styles.innerRing} />
        <span className={styles.number}>{step}</span>
      </div>
      <div className={styles.captions}>
        <span>{left}</span>
        <span className={styles.dot} aria-hidden="true">●</span>
        <span>{right}</span>
      </div>
      <button type="button" className={styles.skip} onClick={end}>{skip}</button>
    </div>
  )
}
