// web/lib/motion/leaderBoot.ts
import {LEADER} from './constants'

export function leaderShouldRun(input: {enabled: boolean; seen: boolean; reducedMotion: boolean}): boolean {
  return input.enabled && !input.seen && !input.reducedMotion
}

/**
 * Inline <head> script: decides before first paint whether the leader runs, so the hero
 * animations are paused (html[data-leader="on"]) exactly like the prototype's unmounted Home.
 */
export function leaderBootSource(enabled: boolean): string {
  return `try{if(${enabled ? 'true' : 'false'}&&sessionStorage.getItem(${JSON.stringify(LEADER.STORAGE_KEY)})!=='1'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.leader='on'}}catch(e){}`
}
