// web/styles/keyframes.test.ts
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {describe, expect, it} from 'vitest'

const NAMES = ['recblink', 'marquee', 'rise', 'dropin', 'popin', 'float', 'kenburns', 'pagein', 'spin', 'glow', 'scrollcue', 'pulse', 'grainshift']

describe('keyframes.css', () => {
  const lines = (file: string) => readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l.startsWith('@keyframes'))
  const ours = lines(resolve(__dirname, 'keyframes.css'))
  const reference = lines(resolve(__dirname, '../../design-reference/keyframes.css'))

  it('contains every prototype keyframe line, byte-identical', () => {
    expect(reference).toHaveLength(NAMES.length)
    for (const line of reference) {
      expect(ours, line.slice(0, 40)).toContain(line)
    }
    for (const name of NAMES) {
      expect(ours.some((l) => l.startsWith(`@keyframes ${name}{`)), name).toBe(true)
    }
  })
})
