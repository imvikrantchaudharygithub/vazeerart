// Every number here is copied from design-reference/design-source.jsx and keyframes.css (spec §3.3).
export const PARALLAX = {LERP: 0.08, SCROLL_CAP_PX: 1200, X_GAIN: 28, Y_GAIN: 20} as const

export const REVEAL = {
  THRESHOLD: 0.12,
  SKIP_VIEWPORT_RATIO: 0.92,
  DISTANCE_PX: 56,
  DURATION_S: 1,
  EASE: 'cubic-bezier(.2,.8,.2,1)',
  STAGGER_S: 0.08,
  STAGGER_MOD: 3,
  INITIAL_SCAN_DELAY_MS: 50,
} as const

export const TIMECODE = {TICK_MS: 40, FPS: 25} as const

export const LEADER = {
  STORAGE_KEY: 'vazeer-leader',
  STEPS: [3, 2, 1] as const,
  STEP_MS: 700,
  OUT_AT_MS: 2100,
  END_AT_MS: 2700,
} as const

// Mobile home hero (export "Vazeer Mobile Hero.html", variant 3a Split → Lens, played lens → split on scroll).
// Design units (du) are the export's 390 × 844 artboard px. Numbers from design-reference/mobile-hero/.
export const MOBILE_HERO = {
  /** Phones only: iPad mini portrait (744) and wider keep the desktop hero. Same literal in MobileHero.module.css and app/page.module.css. */
  QUERY: '(max-width: 743px) and (orientation: portrait)',
  HEADER_PX: 73,
  /** Design rows that must fit in the safe box (small viewport minus the header). */
  Y0: 96,
  Y1: 780,
  /** Scroll distance of the morph and the hold after it, in % of the small viewport height. */
  MORPH_SVH: 40,
  HOLD_SVH: 10,
  /** The export's morph leg; a glide that finishes a part-way scroll runs at this pace. */
  GLIDE_FULL_MS: 2600,
  SMOOTH_MS: 120,
  IDLE_MS: 150,
  INK: [20, 17, 14],
  CREAM: [239, 231, 218],
  AMBER: [232, 162, 74],
} as const
/** Everything that is not a phone: the desktop hero's photo preload only applies there. */
export const DESKTOP_HERO_MEDIA = `not all and ${MOBILE_HERO.QUERY}`
