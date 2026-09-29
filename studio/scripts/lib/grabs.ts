// studio/scripts/lib/grabs.ts
export const GRAB_POOL = ['C', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'N', 'O', 'Q', 'R', 'T', 'V', 'W', 'L'] as const

/** Prototype: g(n) = grabPool[(i*3 + n) % grabPool.length] for n in 0..3 */
export function grabKeysFor(projectIndex: number): string[] {
  return [0, 1, 2, 3].map((n) => GRAB_POOL[(projectIndex * 3 + n) % GRAB_POOL.length])
}

/** Valid LexoRank ("bucket|rank:") the orderable-document-list plugin can re-rank around. */
export function lexoRank(index: number): string {
  if (index < 0 || index > 34) throw new Error('lexoRank supports 0..34')
  return `0|${(index + 1).toString(36)}00000:`
}
