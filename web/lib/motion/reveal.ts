import {REVEAL} from './constants'

export function revealTransition(index: number): string {
  const delay = `${(index % REVEAL.STAGGER_MOD) * REVEAL.STAGGER_S}s`
  const t = `${REVEAL.DURATION_S}s ${REVEAL.EASE} ${delay}`
  return `opacity ${t}, translate ${t}`
}

export const shouldSkipReveal = (top: number, innerHeight: number) => top < innerHeight * REVEAL.SKIP_VIEWPORT_RATIO
