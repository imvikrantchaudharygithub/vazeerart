// web/tools/lib/styleCoverage.mjs
const FONT_MAP = [
  ["'anton',sans-serif", 'var(--font-anton),sans-serif'],
  ["'bodoni moda',serif", 'var(--font-bodoni),serif'],
  ["'instrument sans',sans-serif", 'var(--font-instrument),sans-serif'],
  ["'mrs saint delafield',cursive", 'var(--font-delafield),cursive'],
]

/** "a:1; B : 2 ;color:{{x}}" → ["a:1","b:2"] (bound declarations dropped, fonts rewritten). */
export function normalizeDeclarations(styleText) {
  return styleText
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .filter((d) => !d.includes('{{'))
    .map((d) => {
      const idx = d.indexOf(':')
      const prop = d.slice(0, idx).trim().toLowerCase()
      let value = d.slice(idx + 1).trim().replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ')
      if (prop === 'font-family') {
        const lower = value.toLowerCase()
        for (const [from, to] of FONT_MAP) if (lower === from) value = to
      }
      return `${prop}:${value}`
    })
}

/** Every style="…" in the markup, with 1-based line numbers. */
export function extractMarkupStyles(markup) {
  const out = []
  markup.split('\n').forEach((text, i) => {
    for (const m of text.matchAll(/style="([^"]*)"/g)) {
      out.push({line: i + 1, decls: normalizeDeclarations(m[1])})
    }
  })
  return out
}

/** Flatten all CSS rule bodies (ignoring selectors) into normalized declaration arrays. */
export function parseCssRules(css) {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = []
  for (const m of noComments.matchAll(/\{([^{}]*)\}/g)) {
    const decls = normalizeDeclarations(m[1])
    if (decls.length) rules.push(decls)
  }
  return rules
}

/** Elements whose static declarations are not all present in a single rule. */
export function coverage(elements, rules) {
  const sets = rules.map((r) => new Set(r))
  const uncovered = []
  for (const el of elements) {
    if (el.decls.length === 0) continue
    let best = null
    for (const set of sets) {
      const missing = el.decls.filter((d) => !set.has(d))
      if (missing.length === 0) { best = []; break }
      if (!best || missing.length < best.length) best = missing
    }
    if (best && best.length) uncovered.push({line: el.line, missing: best})
  }
  return uncovered
}
