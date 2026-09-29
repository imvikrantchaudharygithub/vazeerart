// web/tools/verify-styles.mjs
// Usage: node tools/verify-styles.mjs [--lines 1-140]
import {readFileSync, readdirSync, statSync} from 'node:fs'
import {join, resolve} from 'node:path'
import {coverage, extractMarkupStyles, parseCssRules} from './lib/styleCoverage.mjs'

const root = resolve(process.cwd())
const markup = readFileSync(resolve(root, '../design-reference/markup.html'), 'utf8')

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, acc)
    else if (p.endsWith('.css')) acc.push(p)
  }
  return acc
}

const rules = walk(root).flatMap((f) => parseCssRules(readFileSync(f, 'utf8')))
let elements = extractMarkupStyles(markup)

const arg = process.argv.indexOf('--lines')
if (arg !== -1) {
  const [a, b] = process.argv[arg + 1].split('-').map(Number)
  elements = elements.filter((e) => e.line >= a && e.line <= b)
}

const uncovered = coverage(elements, rules)
if (uncovered.length === 0) {
  console.log(`✓ ${elements.length} prototype elements covered by ${rules.length} CSS rules`)
  process.exit(0)
}
for (const u of uncovered) console.log(`line ${u.line}: missing ${u.missing.join(' | ')}`)
console.log(`✗ ${uncovered.length} of ${elements.length} elements not covered`)
process.exit(1)
