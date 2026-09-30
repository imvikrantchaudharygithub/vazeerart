// web/styles/moduleKeyframes.test.ts
import {readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, it} from 'vitest'

const WEB = join(__dirname, '..')
const readLines = (...path: string[]) => readFileSync(join(WEB, '..', 'design-reference', ...path), 'utf8').split('\n').map((l) => l.trim())
// The main prototype's keyframes, plus the mobile hero export's own (variant 3a uses `kb`).
const REFERENCE = [...readLines('keyframes.css'), ...readLines('mobile-hero', 'keyframes.css')]
const KEYWORDS = new Set(['none', 'infinite', 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end', 'alternate', 'alternate-reverse', 'normal', 'both', 'forwards', 'backwards', 'reverse', 'paused', 'running', 'initial', 'inherit', 'unset'])

function moduleFiles(dir: string): string[] {
  try {
    return readdirSync(dir, {recursive: true, withFileTypes: true})
      .filter((d) => d.isFile() && d.name.endsWith('.module.css'))
      .map((d) => join(d.parentPath, d.name))
  } catch { return [] }
}

/** Every keyframe name referenced by animation / animation-name shorthands (all comma items). */
export function animationNames(css: string): string[] {
  const names = new Set<string>()
  for (const m of css.matchAll(/animation(?:-name)?\s*:([^;}]*)/g)) {
    for (const item of m[1].split(',')) {
      const name = item.trim().split(/\s+/).find((t) => t && !KEYWORDS.has(t) && !/^[\d.-]/.test(t) && !t.includes('('))
      if (name) names.add(name)
    }
  }
  return [...names]
}

describe('CSS Modules define every keyframe they animate (CSS Modules localize animation names)', () => {
  const files = [...moduleFiles(join(WEB, 'components')), ...moduleFiles(join(WEB, 'app'))]
  it('finds module files', () => expect(files.length).toBeGreaterThan(0))
  for (const file of files) {
    const css = readFileSync(file, 'utf8')
    const used = animationNames(css)
    const keyframeLines = css.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('@keyframes '))
    const defined = keyframeLines.map((l) => /@keyframes\s+([\w-]+)/.exec(l)![1])
    if (!used.length && !defined.length) continue
    it(`${file.slice(WEB.length + 1)} defines ${used.join(', ') || '(none used)'}`, () => {
      for (const name of used) expect(defined, `missing @keyframes ${name}`).toContain(name)
      for (const line of keyframeLines) expect(REFERENCE, `not verbatim from design-reference/keyframes.css or mobile-hero/keyframes.css: ${line}`).toContain(line)
    })
  }
})
