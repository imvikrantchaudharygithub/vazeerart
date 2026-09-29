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
