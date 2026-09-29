// web/tools/lib/styleCoverage.test.ts
import {describe, expect, it} from 'vitest'
import {coverage, extractMarkupStyles, normalizeDeclarations, parseCssRules} from './styleCoverage.mjs'

describe('normalizeDeclarations', () => {
  it('drops bound declarations and rewrites font families', () => {
    const decls = normalizeDeclarations("color:{{ n.color }};font-family:'Anton',sans-serif; Font-Size: 12px ;")
    expect(decls).toEqual(['font-family:var(--font-anton),sans-serif', 'font-size:12px'])
  })
})

describe('extractMarkupStyles', () => {
  it('captures every style attribute with its line number', () => {
    const out = extractMarkupStyles('<div style="a:1">\n<span style="b:2"><i style="c:3"></i></span>')
    expect(out).toEqual([
      {line: 1, decls: ['a:1']},
      {line: 2, decls: ['b:2']},
      {line: 2, decls: ['c:3']},
    ])
  })
})

describe('coverage', () => {
  const rules = parseCssRules('.x{a:1;b:2}\n.y:hover{c:3}')
  it('covers an element when one rule is a superset of its declarations', () => {
    expect(coverage([{line: 1, decls: ['a:1']}], rules)).toEqual([])
    expect(coverage([{line: 4, decls: ['a:1', 'z:9']}], rules)).toEqual([{line: 4, missing: ['z:9']}])
  })
})
