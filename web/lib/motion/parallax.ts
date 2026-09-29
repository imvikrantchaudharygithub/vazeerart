import {PARALLAX} from './constants'

export const lerp = (current: number, target: number, k: number) => current + (target - current) * k

export function parallaxTransform(cx: number, cy: number, depth: number, scrollFactor: number, scrollY: number): string {
  const sy = Math.min(scrollY, PARALLAX.SCROLL_CAP_PX)
  const x = (cx * depth * PARALLAX.X_GAIN).toFixed(2)
  const y = (cy * depth * PARALLAX.Y_GAIN + sy * scrollFactor).toFixed(2)
  return `translate3d(${x}px,${y}px,0)`
}
